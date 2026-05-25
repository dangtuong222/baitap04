import React, { useState, useEffect } from 'react';
import { Card, Button, Rate, Tag, Space, Spin, Empty, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartOutlined } from '@ant-design/icons';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      if (onAddToCart) {
        const res = await onAddToCart(product);
        if (res?.success) {
          message.success('Đã thêm sản phẩm vào giỏ hàng');
        } else {
          const msg = res?.message || 'Không thể thêm vào giỏ hàng';
          message.error(msg);
          if (String(msg).toLowerCase().includes('đăng nhập') || String(msg).toLowerCase().includes('login')) {
            Modal.confirm({
              title: 'Cần đăng nhập',
              content: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Chuyển tới trang đăng nhập?',
              onOk: () => navigate('/login')
            });
          }
        }
      } else {
        message.error('Chức năng thêm giỏ chưa sẵn sàng');
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
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
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
