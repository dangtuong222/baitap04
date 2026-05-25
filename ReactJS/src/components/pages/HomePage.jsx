import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spin, Empty, Carousel, Button, Input, Space, Tabs, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useProducts } from '../useProducts';
import { useFilters } from '../useFilters';
import ProductCard from '../ProductCard';
import { useCart } from '../useCart';
import HorizontalProductCarousel from '../HorizontalProductCarousel';
import axiosClient from '../util/axios.customize.js';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { products, loading, pagination, fetchProducts } = useProducts();
  const { addToCart } = useCart();
  const { categories, fetchCategories, fetchPriceRange, priceRange } = useFilters();
  
  const [promotions, setPromotions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('latest');

  useEffect(() => {
    fetchPriceRange();
    fetchCategories();
  }, [fetchPriceRange, fetchCategories]);

  useEffect(() => {
    fetchProducts({ sort: 'latest', page: 1, limit: 12, priceRange });
  }, [fetchProducts, priceRange]);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await axiosClient.get('/api/promotions');
      if (res.success) {
        setPromotions(res.data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleTabChange = async (key) => {
    setActiveTab(key);
    const sortMap = {
      latest: 'latest',
      bestseller: 'bestseller',
      rating: 'rating'
    };
    await fetchProducts({ 
      sort: sortMap[key], 
      page: 1, 
      limit: 12,
      priceRange
    });
  };

  const handlePaginationChange = async (page) => {
    const sortMap = {
      latest: 'latest',
      bestseller: 'bestseller',
      rating: 'rating'
    };
    await fetchProducts({ 
      sort: sortMap[activeTab], 
      page, 
      limit: 12,
      priceRange
    });
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-page">
      {/* Search Banner */}
      <div className="search-banner">
        <div className="banner-content">
          <h1>Chào mừng đến cửa hàng của chúng tôi</h1>
          <p>Tìm kiếm hàng ngàn sản phẩm chất lượng</p>
          <Space.Compact style={{ width: '100%', maxWidth: 500 }}>
            <Input
              size="large"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Tìm kiếm
            </Button>
          </Space.Compact>
        </div>
      </div>

      {/* Promotions Carousel */}
      {promotions.length > 0 && (
        <Card className="promotions-card" style={{ marginBottom: 24 }}>
          <Carousel autoplay effect="fade">
            {promotions.map((promo) => (
              <div key={promo.id} className="promo-slide">
                <div className="promo-content">
                  <h2>{promo.title}</h2>
                  <p>{promo.description}</p>
                  {promo.discountPercent > 0 && (
                    <div className="discount-label">
                      Giảm <strong>{promo.discountPercent}%</strong>
                    </div>
                  )}
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate(`/product/${promo.product?.id}`)}
                  >
                    Xem ngay
                  </Button>
                </div>
              </div>
            ))}
          </Carousel>
        </Card>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Card title="Danh mục sản phẩm" className="categories-card" style={{ marginBottom: 32 }}>
          <Row gutter={[16, 16]}>
            {categories.slice(0, 6).map((category) => (
              <Col key={category.id} xs={24} sm={12} md={8} lg={4}>
                <Card
                  hoverable
                  onClick={() => navigate(`/search?category=${category.id}`)}
                  className="category-card"
                >
                  <div className="category-content">
                    {category.image && (
                      <img src={category.image} alt={category.name} />
                    )}
                    <h4>{category.name}</h4>
                    <p>{category.productCount || 0} sản phẩm</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Products */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'latest',
              label: '🆕 Mới nhất',
            },
            {
              key: 'bestseller',
              label: '🔥 Bán chạy nhất',
            },
            {
              key: 'rating',
              label: '⭐ Đánh giá cao',
            },
          ]}
        />

        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Đang tải sản phẩm..." />
          </div>
        ) : products.length === 0 ? (
          <Empty description="Không có sản phẩm" style={{ marginTop: 50 }} />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              {products.map((product) => (
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

            {pagination.total > 0 && (
              <div className="pagination-container">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePaginationChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <HorizontalProductCarousel
        title="🔥 10 sản phẩm bán chạy nhất"
        endpoint="/api/products/bestsellers"
        pageSize={10}
      />

      <HorizontalProductCarousel
        title="👀 10 sản phẩm xem nhiều nhất"
        endpoint="/api/products/most-viewed"
        pageSize={10}
      />
    </div>
  );
};

export default HomePage;
