


# backend/analyzer.py
import json
import re
import time
import logging
from typing import Any, Dict, Optional
import yaml
from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_MODEL
from pdf_parser import extract_text_from_pdf

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Load baseline (unused directly by the prompt but kept for future use)
with open("lma_baseline.yaml", "r") as f:
    try:
        BASELINE = yaml.safe_load(f)
    except Exception:
        BASELINE = {}


# ---------- Helper functions ----------

def normalize_number_amount(s: str) -> str:
    """
    Normalize numeric currency expressions to a canonical string.
    Examples:
      "$43,700,000.00" -> "43700000"
      "EUR 4,500,000" -> "4500000"
      "4.5 million" -> "4500000"
    """
    if not s:
        return ""
    s = s.strip()
    # million/billion words
    m = re.search(r'([\d\.,]+)\s*(million|billion)', s, re.IGNORECASE)
    if m:
        num = m.group(1).replace(',', '')
        factor = 1_000_000 if m.group(2).lower().startswith('m') else 1_000_000_000
        try:
            return str(int(float(num) * factor))
        except Exception:
            pass

    # remove currency symbols and spaces
    s_clean = re.sub(r'[^\d\.\,]', '', s)
    if not s_clean:
        return s  # fallback to original
    # handle thousands separators
    s_clean = s_clean.replace(',', '')
    try:
        if '.' in s_clean:
            val = float(s_clean)
            if val.is_integer():
                return str(int(val))
            return str(val)
        return str(int(s_clean))
    except Exception:
        return s


def safe_search(patterns, text, flags=re.IGNORECASE) -> Optional[str]:
    for p in patterns:
        m = re.search(p, text, flags)
        if m:
            if m.groups():
                for g in m.groups():
                    if g:
                        return g.strip()
            return m.group(0).strip()
    return None


# ---------- Improved metadata extraction ----------

def extract_key_metadata(full_text: str) -> Dict[str, str]:
    """
    Pre-extract key commercial terms using broader regex patterns.
    Returns canonical strings (not numeric conversions) to pass as hints.
    """
    metadata = {"facility_size": "", "margin": "", "tenor": ""}

    # FACILITY SIZE candidates
    facility_patterns = [
        r'(?:Total (?:Loan|Facility|Commitments|Commitment|Amount)[\s:—-]{1,10}|\bLoan Amount[:\s]*|\bFacility Size[:\s]*)'
        r'((?:USD|US\$|\$|CAD|Cdn\.|\u20AC|EUR|GBP|£|\u20AC)?\s*[\d{1,3},]+(?:\.\d+)?(?:\s*(?:million|billion))?)',
        r'\bTotal Commitments[:\s]*([A-Z]{3}\s*[\d,]+(?:\.\d+)?)',
        r'\bAggregate Commitments[:\s]*([A-Z]{3}\s*[\d,]+(?:\.\d+)?)',
        r'([£\$\u20AC]\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?)',
        r'([A-Z]{3}\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?)',
        r'(\d+(?:\.\d+)?\s*(?:million|billion))',
    ]
    fs = safe_search(facility_patterns, full_text)
    if fs:
        metadata['facility_size'] = fs

    # MARGIN patterns
    margin_patterns = [
        r'LIBOR\s*(?:\+|plus)\s*([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'(?:SOFR|RFR|SONIA)\s*(?:\+|plus)\s*([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'Prime Rate(?: Margin)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'Interest\s*=\s*LIBOR\s*(?:\+|plus)\s*([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'Interest Rate\s*[:=]\s*(?:LIBOR\s*\+\s*)?([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'Margin\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*%?',
        r'LIBOR\s*(?:\+|plus)\s*([a-z\s\-]+?)\s*percent',
    ]
    margin = safe_search(margin_patterns, full_text)
    if margin:
        textual = re.search(r'([a-z\s\-]+?)\s*percent', margin, re.IGNORECASE)
        if textual:
            text_val = textual.group(1)
            repl = text_val.replace('point', '.').strip()
            repl = re.sub(r'[^0-9\.]', '', repl)
            if repl:
                metadata['margin'] = repl + '%'
            else:
                metadata['margin'] = margin
        else:
            if re.match(r'^\d+(\.\d+)?$', margin):
                metadata['margin'] = margin + '%'
            else:
                metadata['margin'] = margin

    # TENOR patterns
    tenor_patterns = [
        r'(?:Maturity Date|Final Maturity|Termination Date)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
        r'\b(\d{1,2}\s*(?:years|year))\b',
        r'\b(\d{1,3})\s*months?\b',
        r'\bTerm[:\s]*([0-9]+)\s*(?:years?|months?)\b',
        r'\bMatures\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
        r'(\d+\s*months(?:\s*after\s*closing|following\s*the\s*closing)?)',
    ]
    tenor = safe_search(tenor_patterns, full_text)
    if tenor:
        metadata['tenor'] = tenor

    if metadata['facility_size']:
        metadata['facility_size_canonical'] = normalize_number_amount(metadata['facility_size'])
    else:
        metadata['facility_size_canonical'] = ""

    return metadata


# ---------- Prompt template ----------

PROMPT_TEMPLATE = """
You are an expert loan documentation lawyer familiar with LMA-style syndicated loan agreements.

You will receive:
- The full text of a loan or credit agreement (may not be exactly LMA but similar).
- Pre-extracted metadata hints (facility_size_hint, margin_hint, tenor_hint).

Task:
1. Extract key deal metadata:
   - deal_name
   - borrower
   - facility_size (prefer explicit amounts; if multiple currencies present, list primary with currency)
   - margin (exact text or formula, e.g., "LIBOR + 6.50% (1.00% floor)")
   - tenor (express as months, years, or explicit date)
   - governing_law

2. Extract a list of key clauses. For each clause:
   - id: short identifier like "cov_1"
   - topic: one of [covenants, events_of_default, transferability, sanctions, esg, other]
   - heading: heading or short title if available
   - severity: "red", "amber", or "green" based on deviation from LMA-standard positions
   - is_deviation: true if text is materially borrower-favourable or unusual vs LMA standard
   - is_missing: true if this topic is expected but missing
   - risk_scores:
        - legal: integer 0-100
        - compliance: integer 0-100
        - operational: integer 0-100
   - snippet: 1-3 sentence excerpt or summary of the clause
   - rationale: short explanation of why this is the severity chosen
   - suggested_position: short recommendation for a more LMA-standard position.

3. Provide a summary:
   - overview: 3-5 sentence high-level summary of risks and key features of the agreement.
   - time_saved_hours: rough estimate of manual review time saved if this analysis is done automatically instead of manually. Use a value between 1 and 6.

IMPORTANT LMA-BASED RULES:
- Treat your baseline as current LMA investment grade / leveraged documentation and mainstream European/NY market practice.
- RED (high risk):
  * Missing or materially weakened core protections that are standard in LMA templates:
    - Sanctions / AML / Anti-bribery clauses in syndicated or cross-border lending.
    - Core Events of Default (non-payment, breach of covenants, insolvency, etc.).
    - Transfer restrictions that permit unrestricted transfers to distressed investors,
      sanctioned persons, or competitors.
  * Clauses that create obvious enforcement, ranking, or regulatory problems versus LMA.
- AMBER (medium risk):
  * Borrower-favourable tweaks still seen in practice (larger baskets, longer cure periods,
    tighter transfer consent rights, etc.).
  * Missing ESG provisions should usually be AMBER in older or purely domestic deals.
- GREEN (low risk):
  * Clauses broadly aligned with current LMA wording or only mildly off-market.
- For RED clauses, at least one of legal/compliance/operational scores should be ≥ 80.
- For AMBER clauses, typical scores 40–70.
- For GREEN clauses, scores are usually below 40.

- Use the pre-extracted hints provided for facility_size, margin, and tenor only as suggestions.
- If a hint is empty, search the document for the term; do NOT invent values or defaults.
- ALWAYS output valid JSON that matches exactly the schema shown below.
- Do not include any free text outside the JSON.

SCHEMA:
{json_schema}

HINTS:
facility_size_hint: "{facility_size_hint}"
margin_hint: "{margin_hint}"
tenor_hint: "{tenor_hint}"
"""


def build_json_schema() -> Dict[str, Any]:
    return {
        "deal_metadata": {
            "deal_name": "string",
            "borrower": "string",
            "facility_size": "string",
            "margin": "string",
            "tenor": "string",
            "governing_law": "string",
        },
        "clauses": [
            {
                "id": "string",
                "topic": "string",
                "heading": "string",
                "severity": "string",
                "is_deviation": True,
                "is_missing": False,
                "risk_scores": {
                    "legal": 0,
                    "compliance": 0,
                    "operational": 0,
                },
                "snippet": "string",
                "rationale": "string",
                "suggested_position": "string",
            }
        ],
        "summary": {
            "overview": "string",
            "time_saved_hours": 2.0,
        },
    }


# ---------- LMA-based post-processing ----------

def postprocess_lma_rules(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply simple LMA-based adjustments so key missing protections
    are clearly flagged as RED / AMBER with appropriate scores.
    """
    clauses = data.get("clauses", [])
    for clause in clauses:
        topic = clause.get("topic")
        severity = str(clause.get("severity", "")).lower()
        is_missing = clause.get("is_missing", False)
        rs = clause.get("risk_scores") or {}
        legal = int(rs.get("legal", 0))
        compliance = int(rs.get("compliance", 0))
        operational = int(rs.get("operational", 0))

        # 1) Missing sanctions / AML in syndicated or cross-border loans → RED
        if topic == "sanctions" and is_missing:
            clause["severity"] = "red"
            rs["legal"] = max(legal, 80)
            rs["compliance"] = max(compliance, 90)
            rs["operational"] = max(operational, 60)

        # 2) Missing core Events of Default → RED
        if topic == "events_of_default" and is_missing:
            clause["severity"] = "red"
            rs["legal"] = max(legal, 85)
            rs["compliance"] = max(compliance, 70)

        # 3) ESG missing → AMBER by default
        if topic == "esg" and is_missing and severity != "red":
            clause["severity"] = "amber"
            rs["legal"] = max(legal, 40)
            rs["compliance"] = max(compliance, 50)

        clause["risk_scores"] = rs

    data["clauses"] = clauses
    return data


# ---------- Main analyze function ----------

def analyze_document(file_path: str, max_retries: int = 2) -> Dict[str, Any]:
    """
    Extract text, pre-extract metadata, and call the model to produce a JSON analysis.
    Returns parsed JSON - raises ValueError if the model fails to produce valid JSON after retries.
    """
    logger.info("Extracting text from PDF: %s", file_path)
    full_text = extract_text_from_pdf(file_path) or ""
    if not full_text:
        raise ValueError("No text extracted from PDF")

    # Pre-extract metadata
    logger.info("Pre-extracting metadata using regex heuristics")
    extracted_metadata = extract_key_metadata(full_text)
    facility_hint = extracted_metadata.get('facility_size', '') or ""
    margin_hint = extracted_metadata.get('margin', '') or ""
    tenor_hint = extracted_metadata.get('tenor', '') or ""

    # Build prompt
    schema = build_json_schema()
    prompt = PROMPT_TEMPLATE.format(
        json_schema=json.dumps(schema, indent=2),
        facility_size_hint=facility_hint.replace('"', "'"),
        margin_hint=margin_hint.replace('"', "'"),
        tenor_hint=tenor_hint.replace('"', "'")
    )

    attempts = 0
    last_error = None
    while attempts <= max_retries:
        attempts += 1
        try:
            logger.info("Sending request to model (attempt %d)", attempts)
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": f"{prompt}\n\nDOCUMENT TEXT:\n{full_text}"
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )

            content = None
            if hasattr(response, "output") and isinstance(response.output, list) and response.output:
                for item in response.output:
                    if isinstance(item, dict) and "content" in item:
                        for c in item["content"]:
                            if isinstance(c, dict) and c.get("type") == "json":
                                content = c.get("content")
                                break
                            if isinstance(c, dict) and c.get("type") == "output_text":
                                content = c.get("text")
                        if content:
                            break
            if content is None and hasattr(response, "choices"):
                try:
                    content = response.choices[0].message.content
                except Exception:
                    content = json.dumps(response.choices[0], default=str)

            if not content:
                if isinstance(response, dict):
                    logger.debug("Response is dict; returning as-is")
                    return postprocess_lma_rules(response)
                raise ValueError("Model returned empty content")

            if isinstance(content, dict):
                logger.info("Model returned JSON object directly")
                return postprocess_lma_rules(content)

            if isinstance(content, str):
                json_text = extract_json_substring(content)
                data = json.loads(json_text)
                logger.info("Successfully parsed JSON from model")
                data = postprocess_lma_rules(data)
                return data

            raise ValueError("Unable to interpret model response format")

        except Exception as e:
            last_error = e
            logger.warning("Attempt %d failed: %s", attempts, str(e))
            time.sleep(1 + attempts * 0.5)

    logger.error("Failed to get valid JSON from model after %d attempts: %s", attempts - 1, last_error)
    raise ValueError(f"Model did not return valid JSON after {max_retries+1} attempts: {last_error}")


def extract_json_substring(text: str) -> str:
    """
    Try to find the largest JSON object in `text` by locating first '{' and last '}'.
    This is a best-effort helper to recover from code fences or stray text.
    """
    if not text:
        raise ValueError("No text to extract JSON from")


                  
    # Remove common markdown fences like ``` or ```
    text = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE).strip()


    # Locate the outermost JSON object
    first = text.find('{')
    last = text.rfind('}')
    if first == -1 or last == -1 or last <= first:
        # Fallback: try to parse the entire string
        return text

    candidate = text[first:last + 1]

    # Quick sanity check: roughly balanced braces
    if candidate.count('{') != candidate.count('}'):
        # If unbalanced, just return the original text and let json.loads fail if needed
        return text

    return candidate



# ---------- If run as script, quick test harness ----------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Analyze loan document and extract metadata/clauses")
    parser.add_argument("pdf", help="path to PDF file to analyze")
    parser.add_argument("--out", help="path to save JSON output", default="analysis_output.json")
    args = parser.parse_args()

    try:
        result = analyze_document(args.pdf)
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=2, ensure_ascii=False)
        logger.info("Analysis saved to %s", args.out)
    except Exception as exc:
        logger.exception("Analysis failed: %s", exc)
        raise
        
