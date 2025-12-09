import React, { useMemo } from 'react';
import { Card } from 'antd';
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

  return (
    <Card title="Risk by topic (clause counts)">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="topic" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="red" stackId="a" fill="#cf1322" />
          <Bar dataKey="amber" stackId="a" fill="#faad14" />
          <Bar dataKey="green" stackId="a" fill="#52c41a" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default TopicRiskChart;
