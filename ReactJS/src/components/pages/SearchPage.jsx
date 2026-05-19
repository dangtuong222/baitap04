import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Row, Col, Card, Spin, Empty, Button, Space, Select, Pagination } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useProducts } from '../useProducts';
import { useFilters } from '../useFilters';
import ProductCard from '../ProductCard';
import SearchFilters from '../SearchFilters';
import './SearchPage.css';
import { useLocation } from 'react-router-dom';

const SearchPage = () => {
  const location = useLocation();
  const { products, loading, pagination, fetchProducts } = useProducts();
  const { filters, setFilters, categories, fetchCategories, fetchPriceRange, priceRange } = useFilters();
  
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchPriceRange();
  }, [fetchCategories, fetchPriceRange]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';
    const category = queryParams.get('category') || null;
    const parsedCategory = category ? parseInt(category, 10) : null;
    
    setFilters({
      query,
      category: Number.isNaN(parsedCategory) ? null : parsedCategory,
      priceRange: Array.isArray(priceRange) && priceRange.length === 2 ? priceRange : [0, 10000000],
      rating: null,
      sort: 'latest',
      page: 1,
      limit: 12
    });
  }, [location.search, priceRange, setFilters]);

  const isInfinite = useMemo(() => Boolean(filters.category), [filters.category]);

  useEffect(() => {
    if (filters.query !== undefined) {
      if (isInfinite) {
        setCurrentPage(1);
        fetchProducts({ ...filters, page: 1 }, { append: false });
      } else {
        fetchProducts(filters);
      }
    }
  }, [filters, fetchProducts, isInfinite]);

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

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const totalPages = pagination.pageSize > 0
      ? Math.ceil(pagination.total / pagination.pageSize)
      : 0;
    if (currentPage >= totalPages) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    await fetchProducts({ ...filters, page: nextPage }, { append: true });
    setCurrentPage(nextPage);
    setLoadingMore(false);
  }, [loadingMore, pagination.pageSize, pagination.total, currentPage, fetchProducts, filters]);

  useEffect(() => {
    if (!isInfinite || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    const target = sentinelRef.current;
    observer.observe(target);
    return () => observer.disconnect();
  }, [isInfinite, loadMore]);

  const handleReset = () => {
    setFilters({
      query: filters.query,
      category: null,
      priceRange: Array.isArray(priceRange) && priceRange.length === 2 ? priceRange : [0, 10000000],
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
            priceRangeLimit={priceRange}
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
                      { label: 'Đánh giá cao', value: 'rating' },
                      { label: 'Xem nhiều nhất', value: 'most-viewed' }
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

                {!isInfinite && (
                  <div className="pagination-container">
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                )}

                {isInfinite && (
                  <div className="load-more-container">
                    <div ref={sentinelRef} className="load-more-sentinel" />
                    {loadingMore && <Spin size="small" tip="Đang tải thêm..." />}
                  </div>
                )}
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SearchPage;
