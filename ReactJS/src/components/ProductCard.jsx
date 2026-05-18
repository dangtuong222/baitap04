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

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      // Placeholder xám
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    // Nếu là relative path, thêm backend URL
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    return imageUrl;
  };

  const mainImage = getImageUrl(product.images?.[0]?.imageUrl);

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
