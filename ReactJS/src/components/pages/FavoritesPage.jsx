import React, { useEffect, useState } from 'react';
import { Card, Empty, Row, Col, Spin, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import ProductCard from '../ProductCard';
import { useCart } from '../useCart';
import './FavoritesPage.css';

const { Title } = Typography;

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/favorites');
      if (res?.success) {
        setFavorites(res.data || []);
      } else {
        message.error(res?.message || 'Không thể tải danh sách yêu thích');
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="favorites-page">
      <Title level={3}>Sản phẩm yêu thích</Title>
      <Card>
        {loading ? (
          <div className="favorites-loading">
            <Spin />
          </div>
        ) : favorites.length === 0 ? (
          <Empty description="Chưa có sản phẩm yêu thích" />
        ) : (
          <Row gutter={[16, 16]}>
            {favorites.map((product) => (
              <Col
                key={product.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <ProductCard product={product} onAddToCart={addToCart} />
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default FavoritesPage;
