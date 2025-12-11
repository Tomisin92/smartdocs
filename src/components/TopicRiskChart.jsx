
// export default TopicRiskChart;
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function TopicRiskChart({ clauses }) {
  const data = useMemo(() => {
    if (!clauses) return [];
    const byTopic = {};
    clauses.forEach(c => {
      if (!byTopic[c.topic]) {
        byTopic[c.topic] = { topic: c.topic, red: 0, amber: 0, green: 0 };
      }
      byTopic[c.topic][c.severity] += 1;
    });
    return Object.values(byTopic);
  }, [clauses]);

  // Custom tooltip that shows counts for all risk levels
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const topic = payload[0].payload.topic;
      const red = payload[0].payload.red || 0;
      const amber = payload[0].payload.amber || 0;
      const green = payload[0].payload.green || 0;
      
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{topic}</p>
          {amber > 0 && <p style={{ margin: '4px 0 0 0', color: '#faad14' }}>amber : {amber}</p>}
          {green > 0 && <p style={{ margin: '4px 0 0 0', color: '#52c41a' }}>green : {green}</p>}
          {red > 0 && <p style={{ margin: '4px 0 0 0', color: '#cf1322' }}>red : {red}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      border: '1px solid #d9d9d9', 
      borderRadius: '8px', 
      padding: '16px',
      backgroundColor: 'white',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Risk by topic (clause counts)</h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ bottom: 70, top: 10, left: 10, right: 10 }}>
            <XAxis 
              dataKey="topic" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="red" stackId="a" fill="#cf1322" />
            <Bar dataKey="amber" stackId="a" fill="#faad14" />
            <Bar dataKey="green" stackId="a" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TopicRiskChart;