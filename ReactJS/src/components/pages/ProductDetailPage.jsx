import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spin, Empty, message, Tag, Divider, Button, Space, Breadcrumb, Tabs, Badge, Rate, Form, Input, List, Typography, Radio } from 'antd';
import { HeartOutlined, HeartFilled, ShareAltOutlined } from '@ant-design/icons';
import axiosClient from '../util/axios.customize.js';
import { useCart } from '../useCart';
import ImageSwiper from '../ImageSwiper';
import QuantitySelector from '../QuantitySelector';
import SimilarProducts from '../SimilarProducts';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartLoading } = useCart();
  const [reviewForm] = Form.useForm();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({ canReview: false, eligibleOrderId: null });
  const [rewardType, setRewardType] = useState('POINTS');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const { Text } = Typography;

  useEffect(() => {
    fetchProductDetail();
    fetchReviews();
    fetchReviewEligibility();
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/products/${id}`);
      if (res.success) {
        setProduct(res.data);
        setIsFavorite(!!res.data?.isFavorite);
        fetchSimilarProducts(res.data.id, res.data.categoryId);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      message.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async (productId, categoryId) => {
    setSimilarLoading(true);
    try {
      const res = await axiosClient.get(`/api/products/${productId}/similar?limit=6`);
      if (res.success) {
        setSimilarProducts(res.data);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    } finally {
      setSimilarLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axiosClient.get(`/api/products/${id}/reviews`, { params: { page: 1, limit: 20 } });
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewEligibility = async () => {
    try {
      const res = await axiosClient.get(`/api/products/${id}/review-eligibility`);
      if (res.success) {
        setReviewEligibility(res.data || { canReview: false, eligibleOrderId: null });
      }
    } catch (error) {
      setReviewEligibility({ canReview: false, eligibleOrderId: null });
    }
  };

  const handleAddToCart = async (quantity) => {
    if (product) {
      const res = await addToCart(product, quantity);
      if (res?.success) {
        message.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
      } else {
        message.error(res?.message || 'Không thể thêm vào giỏ hàng');
      }
    }
  };

  const handleViewSimilarProduct = (productId) => {
    navigate(`/product/${productId}`);
    window.scrollTo(0, 0);
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const res = await axiosClient.delete(`/api/favorites/${product.id}`);
        if (res?.success) {
          setIsFavorite(false);
          message.success('Đã xoá khỏi yêu thích');
        }
      } else {
        const res = await axiosClient.post('/api/favorites', { productId: product.id });
        if (res?.success) {
          setIsFavorite(true);
          message.success('Đã thêm vào yêu thích');
        }
      }
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật yêu thích');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSubmitReview = async (values) => {
    setReviewSubmitting(true);
    try {
      const res = await axiosClient.post(`/api/products/${id}/reviews`, {
        rating: values.rating,
        comment: values.comment,
        rewardType,
        orderId: reviewEligibility?.eligibleOrderId
      });
      if (res?.success) {
        const reward = res?.data?.reward;
        if (reward?.type === 'COUPON') {
          message.success(`Nhận mã giảm giá: ${reward.code}`);
        } else if (reward?.type === 'POINTS') {
          message.success(`Bạn nhận ${reward.points} điểm thưởng`);
        } else {
          message.success('Gửi đánh giá thành công');
        }
        reviewForm.resetFields();
        setRewardType('POINTS');
        fetchReviews();
        fetchProductDetail();
        fetchReviewEligibility();
      } else {
        message.error(res?.message || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || error.message || 'Không thể gửi đánh giá');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <Empty description="Sản phẩm không tìm thấy" />
      </div>
    );
  }

  const discount = product.promotions?.length > 0
    ? Math.round((product.promotions[0].discountPercent || 0))
    : 0;

  const reviewTabContent = (
    <div className="reviews-tab">
      {reviewEligibility?.canReview && (
        <Card type="inner" title="Đánh giá sản phẩm" className="review-form-card">
          <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview} initialValues={{ rating: 0 }}>
            <Form.Item
              label="Chọn số sao"
              name="rating"
              rules={[
                { required: true, message: 'Vui lòng chọn số sao' },
                {
                  validator: (_, value) => (
                    value && value > 0 ? Promise.resolve() : Promise.reject(new Error('Vui lòng chọn số sao'))
                  )
                }
              ]}
            >
              <Rate />
            </Form.Item>
            <Form.Item label="Nhận xét" name="comment">
              <Input.TextArea rows={3} placeholder="Chia sẻ cảm nhận của bạn" />
            </Form.Item>
            <Form.Item label="Chọn phần thưởng">
              <Radio.Group
                onChange={(event) => setRewardType(event.target.value)}
                value={rewardType}
              >
                <Radio value="POINTS">Nhận {50} điểm tích lũy</Radio>
                <Radio value="COUPON">Nhận mã giảm giá {10}%</Radio>
              </Radio.Group>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={reviewSubmitting}>
              Gửi đánh giá
            </Button>
          </Form>
        </Card>
      )}

      <Card type="inner" title="Đánh giá từ khách hàng" style={{ marginTop: reviewEligibility?.canReview ? 16 : 0 }}>
        {reviewsLoading ? (
          <Spin />
        ) : reviews.length === 0 ? (
          <Empty description="Chưa có đánh giá nào" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item key={review.id}>
                <div className="review-item">
                  <Space direction="vertical" size={4}>
                    <Text strong>{review.user?.name || 'Khách hàng'}</Text>
                    <Rate disabled value={review.rating} />
                    {review.comment && <Text>{review.comment}</Text>}
                    <Text type="secondary">{new Date(review.createdAt).toLocaleString()}</Text>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item onClick={() => navigate('/')}>
          <Button type="link">Trang chủ</Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate(`/search?category=${product.categoryId}`)}>
          <Button type="link">{product.category?.name}</Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Product Details */}
      <Row gutter={[32, 32]}>
        {/* Images */}
        <Col xs={24} md={12}>
          <ImageSwiper images={product.images || []} />
        </Col>

        {/* Product Info */}
        <Col xs={24} md={12}>
          <Card className="product-info-card">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              
              {/* Title & Category */}
              <div>
                <h1 className="product-title">{product.name}</h1>
                <Tag color="blue" style={{ marginTop: 8 }}>
                  {product.category?.name}
                </Tag>
              </div>

              {/* Rating & Sales */}
              <div className="rating-section">
                <span className="rating">
                  ⭐ {product.rating?.toFixed(1) || 0}
                </span>
                <span className="rating-meta">
                  {product.reviewCount || 0} bình luận
                </span>
                <span className="rating-meta">
                  {product.buyerCount || 0} khách mua
                </span>
                <span className="rating-meta">
                  {product.viewCount || 0} lượt xem
                </span>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Price */}
              <div className="price-section">
                <div className="price-display">
                  <span className="current-price">${product.price}</span>
                  {discount > 0 && (
                    <>
                      <span className="discount-badge">-{discount}%</span>
                      <span className="original-price">
                        ${(product.price / (1 - discount / 100)).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="stock-section">
                {product.stock > 0 ? (
                  <div>
                    <Badge status="success" text={<span className="stock-available">Còn hàng</span>} />
                    <div className="stock-quantity">Tồn kho: <strong>{product.stock}</strong></div>
                  </div>
                ) : (
                  <Badge status="error" text={<span className="stock-unavailable">Hết hàng</span>} />
                )}
              </div>

              {/* Promotions */}
              {product.promotions?.length > 0 && (
                <Card type="inner" className="promotion-card">
                  <h4>Khuyến mãi</h4>
                  {product.promotions.map((promo, index) => (
                    <div key={index} className="promotion-item">
                      <Tag color="red">{promo.title}</Tag>
                      <p>{promo.description}</p>
                    </div>
                  ))}
                </Card>
              )}

              <Divider style={{ margin: '12px 0' }} />

              {/* Quantity & Add to Cart */}
              <QuantitySelector
                stock={product.stock || 0}
                onAddToCart={handleAddToCart}
                loading={cartLoading}
              />

              {/* Actions */}
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button 
                  icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                  type={isFavorite ? 'primary' : 'default'}
                  danger={isFavorite}
                  loading={favoriteLoading}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </Button>
                <Button 
                  icon={<ShareAltOutlined />}
                  onClick={() => message.info('Chia sẻ sản phẩm')}
                >
                  Chia sẻ
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Product Description */}
      <Card style={{ marginTop: 32 }}>
        <Tabs
          items={[
            {
              key: 'description',
              label: 'Mô tả',
              children: (
                <div className="product-description">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p>Không có mô tả sản phẩm</p>
                  )}
                </div>
              ),
            },
            {
              key: 'reviews',
              label: 'Đánh giá & Nhận xét',
              children: reviewTabContent,
            },
            {
              key: 'shipping',
              label: 'Vận chuyển',
              children: <div>Thông tin vận chuyển sẽ được thêm sau</div>,
            },
          ]}
        />
      </Card>

      {/* Similar Products */}
      <SimilarProducts
        products={similarProducts}
        loading={similarLoading}
        onViewProduct={handleViewSimilarProduct}
      />
    </div>
  );
};

export default ProductDetailPage;
