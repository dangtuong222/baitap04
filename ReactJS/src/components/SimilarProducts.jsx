import React from 'react';
import { Card, Row, Col, Tag, Button, Spin, Empty } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import ProductCard from './ProductCard';
import './SimilarProducts.css';

const SimilarProducts = ({ products = [], loading = false, onViewProduct }) => {
  if (loading) {
    return (
      <Card title="Sản phẩm tương tự" className="similar-products-card">
        <Spin />
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card title="Sản phẩm tương tự" className="similar-products-card">
        <Empty description="Không có sản phẩm tương tự" />
      </Card>
    );
  }

  return (
    <Card title="Sản phẩm tương tự" className="similar-products-card">
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <div onClick={() => onViewProduct?.(product.id)}>
              <ProductCard product={product} />
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default SimilarProducts;
