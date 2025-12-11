// src/App.jsx
import React, { useRef, useState } from 'react';
import {
  Layout,
  Button,
  Spin,
  message,
  Space,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './styles/globals.css';
import { analyzeDocument } from './apiClient';
import { downloadHTMLReport } from './utils/exportReport';
import DealHeader from './components/DealHeader';
import RiskSummary from './components/RiskSummary';
import TopicRiskChart from './components/TopicRiskChart';
import HeatmapChart from './components/HeatmapChart';
import ClauseTable from './components/ClauseTable';
import ClauseDetailDrawer from './components/ClauseDetailDrawer';

const { Header, Content } = Layout;

function App() {
  const fileInputRef = useRef(null); // for hero button
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedClause, setSelectedClause] = useState(null);

  // Common upload handler
  const runAnalysis = async (file) => {
    setLoading(true);
    try {
      const data = await analyzeDocument(file);
      setAnalysis(data);
      message.success('Analysis completed successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to analyze document');
    } finally {
      setLoading(false);
    }
  };

  // Hero button → hidden input
  const handleHeroUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleHeroFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runAnalysis(file);
  };

  const handleExport = () => {
    if (!analysis) {
      message.warning('No analysis data to export');
      return;
    }

    try {
      const dealName =
        analysis.deal_metadata?.deal_name || 'loan-agreement';
      const filename = `smartdocs-${dealName
        .toLowerCase()
        .replace(/\s+/g, '-')}-${Date.now()}.html`;
      downloadHTMLReport(analysis, filename);
      message.success('Report exported successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to export report');
    }
  };

  const handleClear = () => {
    setAnalysis(null);
    setSelectedClause(null);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          color: '#fff',
          fontSize: 22,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Space>
          <FileTextOutlined style={{ fontSize: 24 }} />
          <span>SmartDocs – LMA‑style Loan Document Analyzer</span>
        </Space>
        {analysis && (
          <Space>
            <Button onClick={handleClear}>
              Clear analysis
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              size="large"
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                fontWeight: 600,
              }}
            >
              Export Report
            </Button>
          </Space>
        )}
      </Header>

      <Content style={{ padding: 24 }}>
        {/* Hidden input for hero upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleHeroFileChange}
        />

        {/* HERO SECTION when no analysis yet */}
        {!analysis && !loading && (
          <div className="hero">
            <div className="hero-pill">
              Review LMA-style loan docs 3× faster
            </div>

            <h1 className="hero-title">
              Your personal AI loan document reviewer
            </h1>

            <p className="hero-subtitle">
              Upload a loan agreement PDF to get clause‑level risk analysis,
              Green / Amber / Red flags, and a downloadable summary report
              in minutes.
            </p>

            <div className="hero-upload-card">
              <p className="hero-upload-text">
                Try SmartDocs on your own loan documents
              </p>

              <button
                className="hero-upload-button"
                type="button"
                onClick={handleHeroUploadClick}
              >
                ⬆ Upload Loan Agreement PDF
              </button>

              <p className="hero-encryption-note">
                Documents are processed temporarily for analysis only.
              </p>
            </div>

            <div className="hero-logos">
              <span>Built for</span>
              <span className="hero-logo-pill">Syndicated Lending</span>
              <span className="hero-logo-pill">Credit &amp; Legal</span>
              <span className="hero-logo-pill">ESG Financing</span>
            </div>
          </div>
        )}

        {/* Loading state overlay */}
        {loading && (
          <div className="hero-loading">
            <Spin size="large" tip="Analyzing document with AI..." />
            <div style={{ marginTop: 16, color: '#e5e7eb' }}>
              This may take 30–60 seconds depending on document length
            </div>
          </div>
        )}

        {/* ANALYSIS DASHBOARD */}
        {analysis && !loading && (
          <div
            style={{
              animation: 'fadeIn 0.5s ease-in',
              maxWidth: 1200,
              marginInline: 'auto',
            }}
          >
            <DealHeader metadata={analysis.deal_metadata} />
            <RiskSummary
              clauses={analysis.clauses}
              summary={analysis.summary}
            />

            <div
              style={{
                display: 'flex',
                gap: 24,
                marginTop: 24,
                marginBottom: 24,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <TopicRiskChart clauses={analysis.clauses} />
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <HeatmapChart clauses={analysis.clauses} />
              </div>
            </div>

            <ClauseTable
              clauses={analysis.clauses}
              onSelectClause={setSelectedClause}
            />

            <ClauseDetailDrawer
              clause={selectedClause}
              onClose={() => setSelectedClause(null)}
            />
          </div>
        )}
      </Content>
    </Layout>
  );
}

export default App;
