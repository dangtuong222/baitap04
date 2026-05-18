import React from 'react';
import { Card, Row, Col, Checkbox, Slider, Button, Space, Collapse, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import './SearchFilters.css';

const SearchFilters = ({
  categories = [],
  onCategoryChange,
  onPriceChange,
  onRatingChange,
  selectedCategory,
  priceRange,
  selectedRating,
  loading = false,
  onReset
}) => {
  const priceRangeMax = 10000000;

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
              min={0}
              max={priceRangeMax}
              value={priceRange}
              onChange={onPriceChange}
              marks={{
                0: '$0',
                [priceRangeMax]: `$${priceRangeMax}`
              }}
            />
            <div className="price-display">
              ${priceRange[0]} - ${priceRange[1]}
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
