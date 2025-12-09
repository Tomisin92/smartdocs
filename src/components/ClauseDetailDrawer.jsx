import React from 'react';
import { Drawer, Tag } from 'antd';

function ClauseDetailDrawer({ clause, onClose }) {
  return (
    <Drawer
      title={clause ? clause.heading || clause.topic : ''}
      placement="right"
      onClose={onClose}
      open={!!clause}
      width={480}
    >
      {clause && (
        <>
          <p>
            <b>Topic:</b> {clause.topic}{' '}
            <Tag color={clause.severity === 'red' ? 'red' : clause.severity === 'amber' ? 'orange' : 'green'}>
              {clause.severity.toUpperCase()}
            </Tag>
          </p>
          <p><b>Deviation:</b> {clause.is_deviation ? 'Yes' : 'No'}</p>
          <p><b>Missing topic:</b> {clause.is_missing ? 'Yes' : 'No'}</p>
          <p>
            <b>Risk scores:</b> Legal {clause.risk_scores.legal}, Compliance {clause.risk_scores.compliance}, Operational {clause.risk_scores.operational}
          </p>
          <p><b>Snippet:</b><br />{clause.snippet}</p>
          <p><b>Why this severity:</b><br />{clause.rationale}</p>
          <p><b>Suggested position:</b><br />{clause.suggested_position}</p>
        </>
      )}
    </Drawer>
  );
}

export default ClauseDetailDrawer;
