


// src/components/HeatmapChart.jsx
import React, { useMemo } from 'react';
import { Card, Tag } from 'antd';

/**
 * 3×N matrix heatmap:
 * rows  = topics (covenants, events_of_default, etc.)
 * cols  = dimensions: Legal / Compliance / Operational
 * color = average score for that topic & dimension
 */
function HeatmapChart({ clauses }) {
  const matrix = useMemo(() => {
    if (!clauses) return { topics: [], cells: {} };

    const dims = ['legal', 'compliance', 'operational'];
    const topicsSet = new Set();

    // accumulator: key = topic-dim
    const acc = {};

    clauses.forEach(c => {
      topicsSet.add(c.topic);
      dims.forEach(dim => {
        const key = `${c.topic}-${dim}`;
        if (!acc[key]) {
          acc[key] = { sum: 0, count: 0 };
        }
        const value = c.risk_scores?.[dim] ?? 0;
        acc[key].sum += value;
        acc[key].count += 1;
      });
    });

    const topics = Array.from(topicsSet);

    // compute average per cell
    const cells = {};
    topics.forEach(topic => {
      dims.forEach(dim => {
        const key = `${topic}-${dim}`;
        const entry = acc[key];
        const avg = entry && entry.count ? Math.round(entry.sum / entry.count) : 0;
        cells[key] = avg;
      });
    });

    return { topics, cells };
  }, [clauses]);

  const dims = ['legal', 'compliance', 'operational'];

  // map score 0–100 → colour
  const scoreToColor = (score) => {
    if (score === 0) return '#f5f5f5';
    if (score <= 33) return '#52c41a';   // low risk
    if (score <= 66) return '#faad14';   // medium
    return '#cf1322';                    // high
  };

  return (
    <Card title="Risk heatmap (topic × dimension)">
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <Tag color="#52c41a">Low</Tag>
        <Tag color="#faad14">Medium</Tag>
        <Tag color="#cf1322">High</Tag>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 400,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: '1px solid #ddd',
                  padding: '4px 8px',
                  textAlign: 'left',
                }}
              >
                Topic
              </th>
              {dims.map(dim => (
                <th
                  key={dim}
                  style={{
                    borderBottom: '1px solid #ddd',
                    padding: '4px 8px',
                  }}
                >
                  {dim.charAt(0).toUpperCase() + dim.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.topics.map(topic => (
              <tr key={topic}>
                <td
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    padding: '4px 8px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {topic}
                </td>
                {dims.map(dim => {
                  const key = `${topic}-${dim}`;
                  const score = matrix.cells[key] ?? 0;
                  return (
                    <td
                      key={key}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        padding: '2px 4px',
                      }}
                    >
                      <div
                        title={`${dim}: ${score}`}
                        style={{
                          margin: '0 auto',
                          width: 30,
                          height: 18,
                          borderRadius: 4,
                          backgroundColor: scoreToColor(score),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: score > 66 ? '#fff' : '#000',
                          fontSize: 10,
                        }}
                      >
                        {score || ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default HeatmapChart;
