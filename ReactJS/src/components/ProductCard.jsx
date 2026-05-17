import React, { useState, useEffect } from 'react';
import { Card, Button, Rate, Tag, Space, Spin, Empty } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const mainImage = product.images?.[0]?.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';

  return (
    <Card
      hoverable
      className="product-card"
      cover={
        <div className="product-image-wrapper">
          <img alt={product.name} src={mainImage} className="product-image" />
          {product.isBestseller && (
            <Tag color="red" className="bestseller-tag">Bán chạy nhất</Tag>
          )}
        </div>
      }
    >
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div className="product-rating">
            <Rate allowHalf disabled value={product.rating || 0} />
            <span className="rating-text">({product.sold || 0} bán)</span>
          </div>

          <div className="product-price">
            <span className="current-price">${product.price}</span>
            {product.stock === 0 && (
              <Tag color="red" style={{ marginLeft: '8px' }}>Hết hàng</Tag>
            )}
          </div>

          <div className="product-stock">
            Tồn kho: <strong>{product.stock || 0}</strong>
          </div>

          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            block
            loading={isLoading}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            Thêm vào giỏ
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default ProductCard;
