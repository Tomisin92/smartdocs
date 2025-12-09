
/*--------------------------------------------------------------------------------------------------*/
// src/App.jsx
import React, { useState } from 'react';
import { Layout, Upload, Button, Spin, message, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedClause, setSelectedClause] = useState(null);

  const handleUpload = async ({ file }) => {
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

  const handleExport = () => {
    if (!analysis) {
      message.warning('No analysis data to export');
      return;
    }
    
    try {
      const dealName = analysis.deal_metadata?.deal_name || 'loan-agreement';
      const filename = `smartdocs-${dealName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;
      downloadHTMLReport(analysis, filename);
      message.success('Report exported successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to export report');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header 
        style={{ 
          color: '#fff', 
          fontSize: 22,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Space>
          <FileTextOutlined style={{ fontSize: 24 }} />
          <span>SmartDocs – LMA‑style Loan Document Analyzer</span>
        </Space>
        {analysis && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            size="large"
            style={{ 
              background: '#52c41a', 
              borderColor: '#52c41a',
              fontWeight: 600
            }}
          >
            Export Report
          </Button>
        )}
      </Header>
      
      <Content style={{ padding: 24 }}>
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 24
        }}>
          <Space size="large">
            <Upload
              customRequest={handleUpload}
              showUploadList={false}
              accept=".pdf"
              disabled={loading}
            >
              <Button 
                icon={<UploadOutlined />} 
                type="primary"
                size="large"
                loading={loading}
                style={{ fontWeight: 600 }}
              >
                {loading ? 'Analyzing...' : 'Upload Loan Agreement PDF'}
              </Button>
            </Upload>
            
            {analysis && (
              <Button
                type="default"
                size="large"
                onClick={() => setAnalysis(null)}
              >
                Clear Analysis
              </Button>
            )}
          </Space>
          
          {loading && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Spin size="large" tip="Analyzing document with AI..." />
              <div style={{ marginTop: 16, color: '#666' }}>
                This may take 10-30 seconds depending on document length
              </div>
            </div>
          )}
        </div>

        {analysis && !loading && (
          <div style={{ 
            animation: 'fadeIn 0.5s ease-in',
          }}>
            <DealHeader metadata={analysis.deal_metadata} />
            <RiskSummary clauses={analysis.clauses} summary={analysis.summary} />
            
            <div style={{ 
              display: 'flex', 
              gap: 24, 
              marginTop: 24,
              marginBottom: 24 
            }}>
              <div style={{ flex: 1 }}>
                <TopicRiskChart clauses={analysis.clauses} />
              </div>
              <div style={{ flex: 1 }}>
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