import React, { useEffect, useState } from 'react';
import { Card, Steps, Typography, List, Tag, Button, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import './OrderDetailPage.css';

const { Title, Text } = Typography;

const statusMap = {
  NEW: { label: 'Đơn hàng mới', color: 'blue' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'cyan' },
  PREPARING: { label: 'Shop đang chuẩn bị hàng', color: 'gold' },
  SHIPPING: { label: 'Đang giao hàng', color: 'purple' },
  DELIVERED: { label: 'Đã giao thành công', color: 'green' },
  CANCELED: { label: 'Đã hủy', color: 'red' },
  CANCEL_REQUESTED: { label: 'Yêu cầu hủy', color: 'orange' }
};

const stepOrder = ['NEW', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/orders/${id}`);
      if (res?.success) {
        setOrder(res.data);
      } else {
        message.error(res?.message || 'Không thể tải đơn hàng');
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const currentStep = order ? stepOrder.indexOf(order.status) : 0;
  const statusInfo = order ? statusMap[order.status] : null;

  const formatTS = (ts) => ts ? new Date(ts).toLocaleString() : null;

  const stepItems = order ? [
    { title: 'Đơn hàng mới', description: formatTS(order.createdAt) },
    { title: 'Đã xác nhận', description: formatTS(order.confirmedAt) },
    { title: 'Chuẩn bị hàng', description: formatTS(order.preparedAt) },
    { title: 'Đang giao', description: formatTS(order.shippedAt) },
    { title: 'Giao thành công', description: formatTS(order.deliveredAt) }
  ] : [
    { title: 'Đơn hàng mới' },
    { title: 'Đã xác nhận' },
    { title: 'Chuẩn bị hàng' },
    { title: 'Đang giao' },
    { title: 'Giao thành công' }
  ];

  return (
    <div className="order-detail-page">
      <Button type="link" onClick={() => navigate('/orders')}>
        ← Quay lại danh sách đơn hàng
      </Button>

      <Title level={3}>Chi tiết đơn hàng</Title>

      <Card loading={loading} className="order-status-card">
        {!order && !loading ? (
          <Text type="secondary">Không tìm thấy đơn hàng.</Text>
        ) : (
          order && (
            <>
              <div className="order-status-header">
                <Text strong>Mã đơn: </Text>
                <Text code>{order.id}</Text>
                {statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
              </div>
              {['CANCELED', 'CANCEL_REQUESTED'].includes(order.status) ? (
                <>
                  <Text type="danger">Đơn hàng đang ở trạng thái {statusInfo?.label}</Text>
                  <Steps current={Math.max(0, currentStep)} items={stepItems} />
                </>
              ) : (
                <Steps
                  current={currentStep < 0 ? 0 : currentStep}
                  items={stepItems}
                />
              )}
            </>
          )
        )}
      </Card>

      {order && (
        <div className="order-detail-grid">
          <Card>
            <Title level={4}>Thông tin giao hàng</Title>
            <div className="order-info-row">
              <Text>Địa chỉ:</Text>
              <Text strong>{order.shippingAddress}</Text>
            </div>
            <div className="order-info-row">
              <Text>Số điện thoại:</Text>
              <Text strong>{order.phoneNumber}</Text>
            </div>
            <div className="order-info-row">
              <Text>Thanh toán:</Text>
              <Text strong>{order.paymentMethod}</Text>
            </div>
            <div className="order-info-row">
              <Text>Trạng thái thanh toán:</Text>
              <Text strong>{order.paymentStatus}</Text>
            </div>
            {order.note && (
              <div className="order-info-row">
                <Text>Ghi chú:</Text>
                <Text strong>{order.note}</Text>
              </div>
            )}
          </Card>

          <Card>
            <Title level={4}>Sản phẩm đã đặt</Title>
            <List
              dataSource={order.items || []}
              renderItem={(item) => (
                <List.Item>
                  <div className="order-item">
                    <div>
                      <Text strong>{item.product?.name}</Text>
                      <div>
                        <Text type="secondary">x{item.quantity}</Text>
                      </div>
                    </div>
                    <Text>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                  </div>
                </List.Item>
              )}
            />
            <div className="order-total">
              <Text>Tổng thanh toán</Text>
              <Text strong>${parseFloat(order.total || 0).toFixed(2)}</Text>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
