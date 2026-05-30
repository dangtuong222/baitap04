import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Radio, Typography, List, message, Empty, Modal, Space, InputNumber, Tag, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import { useCart } from '../useCart';
import './CheckoutPage.css';

const { Title, Text } = Typography;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, cartItemCount, clearCart, cartLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [summary, setSummary] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const fetchSummary = async (nextCoupon = couponCode, nextPoints = pointsToRedeem) => {
    if (!cart.length) {
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await axiosClient.get('/api/orders/preview', {
        params: {
          couponCode: nextCoupon || undefined,
          points: nextPoints || 0
        }
      });
      if (res?.success) {
        setSummary(res.data);
        setAvailablePoints(res.data.availablePoints ?? availablePoints);
      } else {
        message.error(res?.message || 'Không thể tính toán đơn hàng');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || error.message || 'Không thể tính toán đơn hàng');
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchLoyaltySummary = async () => {
    try {
      const res = await axiosClient.get('/api/loyalty/summary');
      if (res?.success) {
        setAvailablePoints(res.data.points || 0);
        setAvailableCoupons(res.data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty summary:', error);
    }
  };

  useEffect(() => {
    fetchLoyaltySummary();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [cart.length, cartTotal]);

  const handleSubmit = async (values) => {
    const finalTotal = summary?.total ?? cartTotal;
    Modal.confirm({
      title: 'Xác nhận đặt hàng',
      content: `Bạn muốn đặt ${cartItemCount} sản phẩm, tổng ${finalTotal.toFixed(2)}$?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await axiosClient.post('/api/orders', {
            shippingAddress: values.shippingAddress,
            phoneNumber: values.phoneNumber,
            note: values.note,
            paymentMethod: values.paymentMethod,
            couponCode: couponCode || undefined,
            points: pointsToRedeem || 0
          });

          if (res?.success) {
            message.success('Đặt hàng thành công');
            await clearCart();
            navigate(`/orders/${res.data.id}`);
          } else {
            message.error(res?.message || 'Không thể đặt hàng');
          }
        } catch (error) {
          message.error(error.message || 'Không thể đặt hàng');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!cart.length) {
    return (
      <div className="checkout-page">
        <Card>
          <Empty description="Giỏ hàng của bạn đang trống">
            <Button type="primary" onClick={() => navigate('/home')}>
              Quay lại mua sắm
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Title level={3}>Thanh toán đơn hàng</Title>
      <div className="checkout-content">
        <Card className="checkout-form">
          <Title level={4}>Thông tin giao hàng</Title>
          <Form layout="vertical" onFinish={handleSubmit} initialValues={{ paymentMethod: 'COD' }}>
            <Form.Item
              label="Địa chỉ giao hàng"
              name="shippingAddress"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
            >
              <Input placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phoneNumber"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="Số điện thoại liên hệ" />
            </Form.Item>
            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={3} placeholder="Ghi chú cho shop (tuỳ chọn)" />
            </Form.Item>
            <Form.Item label="Phương thức thanh toán" name="paymentMethod">
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>
                  <Radio value="WALLET" disabled>
                    Ví điện tử (sắp ra mắt)
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Divider />
            <Title level={5}>Áp dụng ưu đãi</Title>
            <Form.Item label="Mã giảm giá">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <Button
                  type="primary"
                  loading={previewLoading}
                  onClick={() => fetchSummary(couponCode, pointsToRedeem)}
                >
                  Áp dụng
                </Button>
              </Space.Compact>
            </Form.Item>
            {availableCoupons.length > 0 && (
              <div className="coupon-list">
                {availableCoupons.map((coupon) => (
                  <Tag
                    key={coupon.id}
                    color={coupon.code === couponCode ? 'red' : 'blue'}
                    onClick={() => {
                      setCouponCode(coupon.code);
                      fetchSummary(coupon.code, pointsToRedeem);
                    }}
                  >
                    {coupon.code}
                  </Tag>
                ))}
              </div>
            )}
            <Form.Item label={`Dùng điểm (${availablePoints} điểm khả dụng)`}>
              <Space>
                <InputNumber
                  min={0}
                  max={availablePoints}
                  precision={0}
                  step={1}
                  value={pointsToRedeem}
                  onChange={(value) => setPointsToRedeem(value || 0)}
                />
                <Button
                  loading={previewLoading}
                  onClick={() => fetchSummary(couponCode, pointsToRedeem)}
                >
                  Áp dụng điểm
                </Button>
              </Space>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={cartLoading}>
              Xác nhận đặt hàng
            </Button>
          </Form>
        </Card>

        <Card className="checkout-summary">
          <Title level={4}>Tóm tắt đơn hàng</Title>
          <List
            dataSource={cart}
            renderItem={(item) => (
              <List.Item>
                <div className="summary-item">
                  <Text>{item.product?.name}</Text>
                  <Text type="secondary">x{item.quantity}</Text>
                </div>
              </List.Item>
            )}
          />
          <div className="summary-total">
            <Text>Tổng sản phẩm</Text>
            <Text strong>{cartItemCount}</Text>
          </div>
          <div className="summary-total">
            <Text>Tạm tính</Text>
            <Text strong>${(summary?.subtotal ?? cartTotal).toFixed(2)}</Text>
          </div>
          <div className="summary-total">
            <Text>Giảm khuyến mãi</Text>
            <Text strong>-${(summary?.promotionDiscount ?? 0).toFixed(2)}</Text>
          </div>
          <div className="summary-total">
            <Text>Giảm coupon</Text>
            <Text strong>-${(summary?.couponDiscount ?? 0).toFixed(2)}</Text>
          </div>
          <div className="summary-total">
            <Text>Điểm đã dùng</Text>
            <Text strong>-${(summary?.pointsRedeemed ?? 0).toFixed(2)}</Text>
          </div>
          <div className="summary-total grand-total">
            <Text>Tổng thanh toán</Text>
            <Text strong>${(summary?.total ?? cartTotal).toFixed(2)}</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
