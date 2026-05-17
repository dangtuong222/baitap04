import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spin, Empty, message, Tag, Divider, Button, Space, Breadcrumb, Tabs, Badge } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined, HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCart } from '../useCart';
import ImageSwiper from '../ImageSwiper';
import QuantitySelector from '../QuantitySelector';
import SimilarProducts from '../SimilarProducts';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.data);
        fetchSimilarProducts(res.data.data.id, res.data.data.categoryId);
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
      const res = await axios.get(`/api/products/${productId}/similar?limit=6`);
      if (res.data.success) {
        setSimilarProducts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleAddToCart = (quantity) => {
    if (product) {
      addToCart(product, quantity);
      message.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    }
  };

  const handleViewSimilarProduct = (productId) => {
    navigate(`/product/${productId}`);
    window.scrollTo(0, 0);
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
                  ⭐ {product.rating?.toFixed(1) || 0} ({product.sold || 0} bán)
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
              />

              {/* Actions */}
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button 
                  icon={<HeartOutlined />}
                  onClick={() => message.info('Thêm vào danh sách yêu thích')}
                >
                  Yêu thích
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
              children: <div>Chức năng đánh giá sẽ được thêm sau</div>,
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
