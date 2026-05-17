import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, Empty, Button, Space, message, Select, Pagination } from 'antd';
import { ShoppingCartOutlined, UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useProducts } from '../useProducts';
import { useFilters } from '../useFilters';
import ProductCard from '../ProductCard';
import SearchFilters from '../SearchFilters';
import './SearchPage.css';

const SearchPage = () => {
  const { products, loading, pagination, fetchProducts } = useProducts();
  const { filters, setFilters, categories, fetchCategories } = useFilters();
  
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const query = queryParams.get('q') || '';
    const category = queryParams.get('category') || null;
    
    setFilters({
      query,
      category: category ? parseInt(category) : null,
      priceRange: [0, 10000],
      rating: null,
      sort: 'latest',
      page: 1,
      limit: 12
    });
  }, []);

  useEffect(() => {
    if (filters.query !== undefined) {
      fetchProducts(filters);
    }
  }, [filters]);

  const handleCategoryChange = (categoryId) => {
    setFilters({ ...filters, category: categoryId, page: 1 });
  };

  const handlePriceChange = (range) => {
    setFilters({ ...filters, priceRange: range, page: 1 });
  };

  const handleRatingChange = (rating) => {
    setFilters({ ...filters, rating, page: 1 });
  };

  const handleSortChange = (sort) => {
    setFilters({ ...filters, sort, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo(0, 0);
  };

  const handleReset = () => {
    setFilters({
      query: filters.query,
      category: null,
      priceRange: [0, 10000],
      rating: null,
      sort: 'latest',
      page: 1,
      limit: 12
    });
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Tìm kiếm sản phẩm</h1>
        {filters.query && <p>Kết quả tìm kiếm cho: <strong>"{filters.query}"</strong></p>}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={6}>
          <SearchFilters
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onRatingChange={handleRatingChange}
            selectedCategory={filters.category}
            priceRange={filters.priceRange}
            selectedRating={filters.rating}
            onReset={handleReset}
          />
        </Col>

        <Col xs={24} md={18}>
          <div className="products-section">
            {/* Toolbar */}
            <Card className="toolbar-card">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>
                  Hiển thị <strong>{products.length}</strong> trong <strong>{pagination.total}</strong> sản phẩm
                </span>
                <Space>
                  <Select
                    value={filters.sort}
                    onChange={handleSortChange}
                    style={{ width: 150 }}
                    options={[
                      { label: 'Mới nhất', value: 'latest' },
                      { label: 'Cũ nhất', value: 'oldest' },
                      { label: 'Giá thấp nhất', value: 'price-low' },
                      { label: 'Giá cao nhất', value: 'price-high' },
                      { label: 'Bán chạy nhất', value: 'bestseller' },
                      { label: 'Đánh giá cao', value: 'rating' }
                    ]}
                  />
                  <Button.Group>
                    <Button
                      icon={<AppstoreOutlined />}
                      type={viewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setViewMode('grid')}
                    />
                    <Button
                      icon={<UnorderedListOutlined />}
                      type={viewMode === 'list' ? 'primary' : 'default'}
                      onClick={() => setViewMode('list')}
                    />
                  </Button.Group>
                </Space>
              </Space>
            </Card>

            {/* Products Grid */}
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Đang tải sản phẩm..." />
              </div>
            ) : products.length === 0 ? (
              <Empty
                description="Không tìm thấy sản phẩm"
                style={{ marginTop: 50 }}
              />
            ) : (
              <>
                <Row gutter={[16, 16]} className={`products-${viewMode}`}>
                  {products.map((product) => (
                    <Col
                      key={product.id}
                      xs={24}
                      sm={viewMode === 'grid' ? 12 : 24}
                      md={viewMode === 'grid' ? 12 : 24}
                      lg={viewMode === 'grid' ? 8 : 24}
                    >
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                <div className="pagination-container">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SearchPage;
