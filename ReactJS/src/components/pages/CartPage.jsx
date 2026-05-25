import React, { useEffect } from 'react';
import { Card, Table, Button, Space, Typography, InputNumber, Empty, message, Row, Col, Modal } from 'antd';
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../useCart';
import './CartPage.css';

const { Title, Text } = Typography;

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartLoading,
    cartTotal,
    cartItemCount,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    refreshCart
  } = useCart();

  useEffect(() => {
    refreshCart?.();
  }, [refreshCart]);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23f0f0f0" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    return imageUrl;
  };

  const handleQuantityChange = async (productId, value) => {
    if (typeof value !== 'number') {
      return;
    }
    const res = await updateCartQuantity(productId, value);
    if (!res?.success) {
      message.error(res?.message || 'Không thể cập nhật giỏ hàng');
    }
  };

  const handleRemove = async (productId) => {
    const res = await removeFromCart(productId);
    if (!res?.success) {
      message.error(res?.message || 'Không thể xoá sản phẩm');
    }
  };

  const handleClear = async () => {
    Modal.confirm({
      title: 'Xác nhận',
      content: 'Bạn có chắc muốn xóa toàn bộ giỏ hàng không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        const res = await clearCart();
        if (res?.success) {
          message.success('Đã xoá giỏ hàng');
        } else {
          message.error(res?.message || 'Không thể xoá giỏ hàng');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (_, record) => (
        <div className="cart-product">
          <img
            src={getImageUrl(record.product?.images?.[0]?.imageUrl)}
            alt={record.product?.name}
          />
          <div>
            <Text strong>{record.product?.name || 'Sản phẩm'}</Text>
            <div className="cart-product-meta">
              <Text type="secondary">Mã: {record.productId}</Text>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (_, record) => (
        <Text>${parseFloat(record.unitPrice || record.product?.price || 0).toFixed(2)}</Text>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value, record) => (
        <InputNumber
          min={1}
          max={record.product?.stock || 99}
          value={value}
          onChange={(val) => handleQuantityChange(record.productId, val)}
        />
      )
    },
    {
      title: 'Thành tiền',
      key: 'lineTotal',
      render: (_, record) => {
        const unitPrice = parseFloat(record.unitPrice || record.product?.price || 0);
        return <Text strong>${(unitPrice * record.quantity).toFixed(2)}</Text>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record.productId)}
        >
          Xoá
        </Button>
      )
    }
  ];

  if (!cart.length && !cartLoading) {
    return (
      <div className="cart-page">
        <Card>
          <Empty description="Giỏ hàng của bạn đang trống">
            <Button type="primary" onClick={() => navigate('/home')}>
              Tiếp tục mua sắm
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Title level={3}>Giỏ hàng</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Table
              columns={columns}
              dataSource={cart}
              rowKey={(record) => record.id || record.productId}
              pagination={false}
              loading={cartLoading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="cart-summary">
            <Title level={4}>Tóm tắt đơn hàng</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div className="summary-row">
                <Text>Số lượng sản phẩm</Text>
                <Text strong>{cartItemCount}</Text>
              </div>
              <div className="summary-row">
                <Text>Tạm tính</Text>
                <Text strong>${cartTotal.toFixed(2)}</Text>
              </div>
              <Button type="primary" icon={<ShoppingOutlined />} onClick={() => navigate('/checkout')} disabled={cartLoading} loading={cartLoading}>
                Thanh toán COD
              </Button>
              <Button onClick={handleClear} danger disabled={cartLoading} loading={cartLoading}>
                Xoá toàn bộ giỏ hàng
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartPage;
