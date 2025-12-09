


// src/utils/exportReport.js

export const exportToHTML = (analysisData) => {
  const { deal_metadata, clauses, summary } = analysisData;
  
  const redCount = clauses.filter(c => c.severity?.toLowerCase() === 'red').length;
  const amberCount = clauses.filter(c => c.severity?.toLowerCase() === 'amber').length;
  const greenCount = clauses.filter(c => c.severity?.toLowerCase() === 'green').length;
  const deviationCount = clauses.filter(c => c.is_deviation).length;
  const missingCount = clauses.filter(c => c.is_missing).length;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartDocs Analysis Report - ${deal_metadata.deal_name || 'Loan Agreement'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .header {
      border-bottom: 3px solid #1890ff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1890ff;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #262626;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e8e8e8;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;
      border-left: 3px solid #1890ff;
    }
    .info-label {
      font-size: 12px;
      color: #8c8c8c;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 15px;
      color: #262626;
      font-weight: 500;
    }
    .risk-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .risk-card {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #e8e8e8;
    }
    .risk-card.red { background: #fff1f0; border-color: #ffa39e; }
    .risk-card.amber { background: #fff7e6; border-color: #ffd591; }
    .risk-card.green { background: #f6ffed; border-color: #b7eb8f; }
    .risk-card.total { background: #e6f7ff; border-color: #91d5ff; }
    .risk-number {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .risk-card.red .risk-number { color: #cf1322; }
    .risk-card.amber .risk-number { color: #d46b08; }
    .risk-card.green .risk-number { color: #389e0d; }
    .risk-card.total .risk-number { color: #096dd9; }
    .risk-label {
      font-size: 13px;
      color: #595959;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .percentage-badge {
      display: inline-block;
      background: #ff7875;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      margin-left: 8px;
    }
    .overview-box {
      background: #f0f5ff;
      border: 1px solid #adc6ff;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .overview-box p {
      margin-bottom: 0;
      font-size: 15px;
      line-height: 1.8;
    }
    .clause-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 14px;
    }
    .clause-table th {
      background: #fafafa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e8e8e8;
      color: #262626;
    }
    .clause-table td {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }
    .clause-table tr:hover {
      background: #fafafa;
    }
    .tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 6px;
    }
    .tag.red {
      background: #fff1f0;
      color: #cf1322;
      border: 1px solid #ffa39e;
    }
    .tag.amber {
      background: #fff7e6;
      color: #d46b08;
      border: 1px solid #ffd591;
    }
    .tag.green {
      background: #f6ffed;
      color: #389e0d;
      border: 1px solid #b7eb8f;
    }
    .tag.deviation {
      background: #fff2e8;
      color: #d4380d;
      border: 1px solid #ffbb96;
    }
    .tag.missing {
      background: #fff0f6;
      color: #c41d7f;
      border: 1px solid #ffadd2;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e8e8e8;
      text-align: center;
      color: #8c8c8c;
      font-size: 13px;
    }
    .time-saved {
      display: inline-block;
      background: #52c41a;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin: 10px 0;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 SmartDocs Analysis Report</h1>
      <div class="subtitle">LMA-style Loan Agreement Analysis | Generated ${new Date().toLocaleString()}</div>
    </div>

    <!-- Deal Metadata -->
    <div class="section">
      <h2 class="section-title">Deal Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Deal Name</div>
          <div class="info-value">${deal_metadata.deal_name || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Borrower</div>
          <div class="info-value">${deal_metadata.borrower || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Facility Size</div>
          <div class="info-value">${deal_metadata.facility_size || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Margin</div>
          <div class="info-value">${deal_metadata.margin || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tenor</div>
          <div class="info-value">${deal_metadata.tenor || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Governing Law</div>
          <div class="info-value">${deal_metadata.governing_law || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Risk Summary -->
    <div class="section">
      <h2 class="section-title">Risk Summary</h2>
      <div class="risk-summary">
        <div class="risk-card total">
          <div class="risk-number">${clauses.length}</div>
          <div class="risk-label">Total Clauses</div>
        </div>
        <div class="risk-card red">
          <div class="risk-number">${redCount}</div>
          <div class="risk-label">Red Flags</div>
        </div>
        <div class="risk-card amber">
          <div class="risk-number">${amberCount}</div>
          <div class="risk-label">Amber Warnings</div>
        </div>
        <div class="risk-card green">
          <div class="risk-number">${greenCount}</div>
          <div class="risk-label">Green (Standard)</div>
        </div>
      </div>
      <div class="info-grid" style="margin-top: 15px;">
        <div class="info-item" style="border-left-color: #d46b08;">
          <div class="info-label">Deviations Identified</div>
          <div class="info-value">${deviationCount} clause${deviationCount !== 1 ? 's' : ''} 
            <span class="percentage-badge">${((deviationCount/clauses.length)*100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="info-item" style="border-left-color: #c41d7f;">
          <div class="info-label">Missing Clauses</div>
          <div class="info-value">${missingCount} expected clause${missingCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      <div class="overview-box">
        <p>${summary.overview || 'No summary available.'}</p>
      </div>
      <div class="time-saved">
        ⏱️ Estimated Time Saved: ${summary.time_saved_hours || 0} hours
      </div>
    </div>

    <!-- Detailed Clause Analysis -->
    <div class="section">
      <h2 class="section-title">Detailed Clause Analysis</h2>
      <table class="clause-table">
        <thead>
          <tr>
            <th style="width: 15%;">Topic</th>
            <th style="width: 20%;">Heading</th>
            <th style="width: 10%;">Severity</th>
            <th style="width: 15%;">Status</th>
            <th style="width: 40%;">Analysis</th>
          </tr>
        </thead>
        <tbody>
          ${clauses.map(clause => `
            <tr>
              <td style="text-transform: capitalize;">${clause.topic?.replace(/_/g, ' ')}</td>
              <td><strong>${clause.heading}</strong></td>
              <td><span class="tag ${clause.severity?.toLowerCase()}">${clause.severity?.toUpperCase()}</span></td>
              <td>
                ${clause.is_deviation ? '<span class="tag deviation">DEVIATION</span>' : ''}
                ${clause.is_missing ? '<span class="tag missing">MISSING</span>' : ''}
                ${!clause.is_deviation && !clause.is_missing ? '<span class="tag green">STANDARD</span>' : ''}
              </td>
              <td>
                <div style="margin-bottom: 8px;"><strong>Snippet:</strong> ${clause.snippet}</div>
                <div style="margin-bottom: 8px;"><strong>Rationale:</strong> ${clause.rationale}</div>
                ${clause.suggested_position ? `<div style="background: #f6ffed; padding: 8px; border-radius: 4px; margin-top: 8px;"><strong>Suggested:</strong> ${clause.suggested_position}</div>` : ''}
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                  Risk Scores: Legal ${clause.risk_scores?.legal || 0} | Compliance ${clause.risk_scores?.compliance || 0} | Operational ${clause.risk_scores?.operational || 0}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>SmartDocs</strong> - AI-Powered LMA Loan Document Analysis</p>
      <p>This report was generated automatically. Please review with legal counsel before making decisions.</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};

export const downloadHTMLReport = (analysisData, filename = 'smartdocs-analysis-report.html') => {
  const html = exportToHTML(analysisData);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};