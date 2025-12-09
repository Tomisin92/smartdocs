


// src/components/RiskSummary.jsx
import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';

function RiskSummary({ clauses, summary }) {
  const stats = useMemo(() => {
    if (!clauses) return null;

    const total = clauses.length;
    const red = clauses.filter(c => c.severity === 'red').length;
    const amber = clauses.filter(c => c.severity === 'amber').length;
    const green = clauses.filter(c => c.severity === 'green').length;
    const deviations = clauses.filter(c => c.is_deviation).length;
    const missing = clauses.filter(c => c.is_missing).length;

    // Weights for red/amber issues
    const redWeight = 1.0;
    const amberWeight = 0.5;

    // Fraction of clauses that are problematic (red/amber)
    const riskFraction = total
      ? (red * redWeight + amber * amberWeight) / total
      : 0;

    // Higher fraction of issues → lower score (0–100)
    const riskScore = Math.round(100 * (1 - riskFraction));

    const deviationPct = total ? Math.round((deviations / total) * 100) : 0;

    return {
      total,
      red,
      amber,
      green,
      deviations,
      missing,
      deviationPct,
      riskScore,
    };
  }, [clauses]);

  if (!stats) return null;

  return (
    <Card style={{ marginTop: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <h4>Overall Document Risk</h4>
          <Progress
            type="dashboard"
            percent={stats.riskScore}
            format={p => `${p}`}
          />
        </Col>
        <Col span={18}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="Total clauses" value={stats.total} />
            </Col>
            <Col span={4}>
              <Statistic
                title="Red"
                value={stats.red}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Amber"
                value={stats.amber}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Green"
                value={stats.green}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Deviations (%)"
                value={stats.deviationPct}
                suffix="%"
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Missing clauses"
                value={stats.missing}
              />
            </Col>
          </Row>
          {summary && (
            <div style={{ marginTop: 16 }}>
              <b>Overview:</b> {summary.overview}
              <br />
              <b>Estimated manual review hours saved:</b>{' '}
              {summary.time_saved_hours.toFixed(1)}
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
}

export default RiskSummary;
