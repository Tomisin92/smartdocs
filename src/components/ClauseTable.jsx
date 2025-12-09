



import React, { useState } from 'react';
import { Card, Table, Tag, Drawer, Button, Space, Descriptions, Badge, Row, Col, Statistic } from 'antd';
import { FilterOutlined, EyeOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

function ClauseTable({ clauses, onSelectClause }) {
  const [selectedClause, setSelectedClause] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filter, setFilter] = useState('all');

  if (!clauses) return null;

  const handleRowClick = (record) => {
    setSelectedClause(record);
    setDrawerVisible(true);
    if (onSelectClause) onSelectClause(record);
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'red') return <WarningOutlined />;
    if (severity === 'amber') return <InfoCircleOutlined />;
    return <CheckCircleOutlined />;
  };

  // Filter clauses
  const filteredClauses = clauses.filter(clause => {
    if (filter === 'all') return true;
    return clause.severity?.toLowerCase() === filter;
  });

  const columns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{text?.replace(/_/g, ' ')}</span>,
    },
    {
      title: 'Heading',
      dataIndex: 'heading',
      key: 'heading',
      ellipsis: true,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (sev) => {
        const color = sev === 'red' ? 'red' : sev === 'amber' ? 'orange' : 'green';
        return (
          <Tag icon={getSeverityIcon(sev)} color={color} style={{ fontWeight: 600 }}>
            {sev?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space size={4}>
          {record.is_deviation && <Tag color="volcano">DEVIATION</Tag>}
          {record.is_missing && <Tag color="magenta">MISSING</Tag>}
        </Space>
      ),
    },
    {
      title: 'Snippet',
      dataIndex: 'snippet',
      key: 'snippet',
      ellipsis: true,
      width: '35%',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleRowClick(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  const redCount = clauses.filter(c => c.severity?.toLowerCase() === 'red').length;
  const amberCount = clauses.filter(c => c.severity?.toLowerCase() === 'amber').length;
  const greenCount = clauses.filter(c => c.severity?.toLowerCase() === 'green').length;

  return (
    <>
      <Card 
        title={
          <Space>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Clause Explorer</span>
            <Badge count={filteredClauses.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        style={{ marginTop: 24 }}
        extra={
          <Space size="middle">
            <Button
              type={filter === 'all' ? 'primary' : 'default'}
              onClick={() => setFilter('all')}
              icon={<FilterOutlined />}
            >
              All ({clauses.length})
            </Button>
            <Button
              type={filter === 'red' ? 'primary' : 'default'}
              danger={filter === 'red'}
              onClick={() => setFilter('red')}
              disabled={redCount === 0}
            >
              Red ({redCount})
            </Button>
            <Button
              type={filter === 'amber' ? 'primary' : 'default'}
              onClick={() => setFilter('amber')}
              style={filter === 'amber' ? { backgroundColor: '#fa8c16', borderColor: '#fa8c16' } : {}}
              disabled={amberCount === 0}
            >
              Amber ({amberCount})
            </Button>
            <Button
              type={filter === 'green' ? 'primary' : 'default'}
              onClick={() => setFilter('green')}
              style={filter === 'green' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
              disabled={greenCount === 0}
            >
              Green ({greenCount})
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredClauses}
          size="small"
          pagination={{ pageSize: 10 }}
          onRow={record => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName="hover:bg-blue-50"
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            {selectedClause && getSeverityIcon(selectedClause.severity)}
            <span>{selectedClause?.heading || 'Clause Details'}</span>
          </Space>
        }
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {selectedClause?.severity && (
              <Tag 
                color={
                  selectedClause.severity === 'red' ? 'red' : 
                  selectedClause.severity === 'amber' ? 'orange' : 
                  'green'
                }
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {selectedClause.severity.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
      >
        {selectedClause && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Risk Scores */}
            <Card title="Risk Scores" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Legal Risk"
                    value={selectedClause.risk_scores?.legal || 0}
                    suffix="/ 100"
                    valueStyle={{ 
                      color: selectedClause.risk_scores?.legal > 70 ? '#cf1322' : 
                             selectedClause.risk_scores?.legal > 40 ? '#fa8c16' : '#3f8600'
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Compliance Risk"
                    value={selectedClause.risk_scores?.compliance || 0}
                    suffix="/ 100"
                    valueStyle={{ 
                      color: selectedClause.risk_scores?.compliance > 70 ? '#cf1322' : 
                             selectedClause.risk_scores?.compliance > 40 ? '#fa8c16' : '#3f8600'
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Operational Risk"
                    value={selectedClause.risk_scores?.operational || 0}
                    suffix="/ 100"
                    valueStyle={{ 
                      color: selectedClause.risk_scores?.operational > 70 ? '#cf1322' : 
                             selectedClause.risk_scores?.operational > 40 ? '#fa8c16' : '#3f8600'
                    }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Clause Details */}
            <Descriptions title="Clause Information" bordered size="small">
              <Descriptions.Item label="ID" span={3}>{selectedClause.id}</Descriptions.Item>
              <Descriptions.Item label="Topic" span={3}>
                <Tag color="blue">{selectedClause.topic?.replace(/_/g, ' ').toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={3}>
                <Space>
                  {selectedClause.is_deviation && <Tag color="volcano">DEVIATION</Tag>}
                  {selectedClause.is_missing && <Tag color="magenta">MISSING</Tag>}
                  {!selectedClause.is_deviation && !selectedClause.is_missing && <Tag color="green">STANDARD</Tag>}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* Full Snippet */}
            <Card title="Full Text Excerpt" size="small">
              <p style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '14px', 
                lineHeight: '1.6',
                backgroundColor: '#fafafa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}>
                {selectedClause.snippet}
              </p>
            </Card>

            {/* Rationale */}
            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>Analysis Rationale</span>
                </Space>
              } 
              size="small"
            >
              <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {selectedClause.rationale}
              </p>
            </Card>

            {/* Suggested Position */}
            {selectedClause.suggested_position && (
              <Card 
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>Recommended Position</span>
                  </Space>
                } 
                size="small"
                style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: 0 }}>
                  {selectedClause.suggested_position}
                </p>
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </>
  );
}

export default ClauseTable;