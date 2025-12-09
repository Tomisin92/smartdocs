import React from 'react';
import { Card, Row, Col } from 'antd';

function DealHeader({ metadata }) {
  if (!metadata) return null;
  return (
    <Card style={{ marginTop: 16 }}>
      <Row gutter={16}>
        <Col span={8}>
          <h3>{metadata.deal_name}</h3>
          <div>Borrower: {metadata.borrower}</div>
          <div>Governing law: {metadata.governing_law}</div>
        </Col>
        <Col span={8}>
          <div>Facility size: {metadata.facility_size}</div>
          <div>Margin: {metadata.margin}</div>
        </Col>
        <Col span={8}>
          <div>Tenor: {metadata.tenor}</div>
        </Col>
      </Row>
    </Card>
  );
}

export default DealHeader;
