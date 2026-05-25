import React, { useState } from 'react';
import { Card, Form, Input, Button, Radio, Typography, List, message, Empty, Modal, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import { useCart } from '../useCart';
import './CheckoutPage.css';

const { Title, Text } = Typography;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, cartItemCount, clearCart, cartLoading } = useCart();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    Modal.confirm({
      title: 'Xác nhận đặt hàng',
      content: `Bạn muốn đặt ${cartItemCount} sản phẩm, tổng ${cartTotal.toFixed(2)}$?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await axiosClient.post('/api/orders', {
            shippingAddress: values.shippingAddress,
            phoneNumber: values.phoneNumber,
            note: values.note,
            paymentMethod: values.paymentMethod
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
            <Text>Tổng thanh toán</Text>
            <Text strong>${cartTotal.toFixed(2)}</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
