import React from 'react';
import { Card, Checkbox, Slider, Button, Space, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import './SearchFilters.css';

const SearchFilters = ({
  categories = [],
  onCategoryChange,
  onPriceChange,
  onRatingChange,
  selectedCategory,
  priceRange,
  priceRangeLimit = [0, 10000000],
  selectedRating,
  loading = false,
  onReset
}) => {
  const [priceRangeMin, priceRangeMax] = Array.isArray(priceRangeLimit) && priceRangeLimit.length === 2
    ? priceRangeLimit
    : [0, 10000000];
  const safePriceRange = Array.isArray(priceRange) && priceRange.length === 2
    ? priceRange
    : [priceRangeMin, priceRangeMax];
  const formatPrice = (value) => `${value.toLocaleString('vi-VN')}₫`;

  return (
    <Card className="search-filters-card" title={<><FilterOutlined /> Bộ lọc</>}>
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* Category Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Danh mục</h3>
            <Space direction="vertical" style={{ width: '100%' }}>
              {categories.map((cat) => (
                <Checkbox
                  key={cat.id}
                  checked={selectedCategory === cat.id}
                  onChange={(e) => onCategoryChange(e.target.checked ? cat.id : null)}
                >
                  {cat.name}
                  <span className="category-count">({cat.productCount || 0})</span>
                </Checkbox>
              ))}
            </Space>
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Khoảng giá</h3>
            <Slider
              range
              min={priceRangeMin}
              max={priceRangeMax}
              value={safePriceRange}
              onChange={onPriceChange}
              marks={{
                [priceRangeMin]: formatPrice(priceRangeMin),
                [priceRangeMax]: formatPrice(priceRangeMax)
              }}
            />
            <div className="price-display">
              {formatPrice(safePriceRange[0])} - {formatPrice(safePriceRange[1])}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Đánh giá</h3>
            <Space direction="vertical">
              {[5, 4, 3, 2, 1].map((star) => (
                <Checkbox
                  key={star}
                  checked={selectedRating === star}
                  onChange={(e) => onRatingChange(e.target.checked ? star : null)}
                >
                  {Array(star).fill('⭐').join('')} trở lên
                </Checkbox>
              ))}
            </Space>
          </div>

          {/* Reset Button */}
          <Button block onClick={onReset} type="default">
            Xóa bộ lọc
          </Button>
        </Space>
      </Spin>
    </Card>
  );
};

export default SearchFilters;
