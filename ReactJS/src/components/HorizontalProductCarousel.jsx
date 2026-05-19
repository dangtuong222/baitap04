import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Empty } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import axiosClient from './util/axios.customize.js';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import './HorizontalProductCarousel.css';

const HorizontalProductCarousel = ({ title, endpoint, pageSize = 10 }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);

  const fetchPage = async (page) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(endpoint, { params: { page, limit: pageSize } });
      if (res.success) {
        setItems(res.data || []);
        setPagination(res.pagination || { currentPage: page, totalPages: 1, totalItems: res.data?.length || 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [endpoint, pageSize]);

  const handlePrev = () => {
    if (pagination.currentPage > 1) {
      fetchPage(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchPage(pagination.currentPage + 1);
    }
  };

  return (
    <Card
      className="horizontal-section"
      title={title}
      extra={
        <div className="horizontal-pagination">
          <Button
            size="small"
            icon={<LeftOutlined />}
            onClick={handlePrev}
            disabled={pagination.currentPage <= 1}
          />
          <span className="horizontal-page-info">
            {pagination.currentPage} / {pagination.totalPages || 1}
          </span>
          <Button
            size="small"
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={pagination.currentPage >= pagination.totalPages}
          />
        </div>
      }
    >
      {loading ? (
        <div className="horizontal-loading">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty description="Không có sản phẩm" />
      ) : (
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={16}
          slidesPerView={4}
          breakpoints={{
            0: { slidesPerView: 1.2 },
            576: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            992: { slidesPerView: 4 }
          }}
        >
          {items.map((product) => (
            <SwiperSlide key={product.id}>
              <div onClick={() => navigate(`/product/${product.id}`)}>
                <ProductCard product={product} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </Card>
  );
};

export default HorizontalProductCarousel;
