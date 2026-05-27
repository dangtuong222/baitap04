import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import './OrdersPage.css';

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

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/orders');
      if (res?.success) {
        setOrders(res.data || []);
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
    fetchOrders();
  }, []);

  const getOrderAgeMinutes = (order) => {
    const createdAt = new Date(order.createdAt);
    return (Date.now() - createdAt.getTime()) / (60 * 1000);
  };

  const isWithinCancelWindow = (order) => getOrderAgeMinutes(order) <= 30;

  const canCancelDirectly = (order) => ['NEW', 'CONFIRMED'].includes(order.status);

  const canRequestCancel = (order) => (
    order.status === 'PREPARING' && isWithinCancelWindow(order)
  );

  const handleCancel = async (order) => {
    setCancellingOrderId(order.id);
    try {
      const res = await axiosClient.post(`/api/orders/${order.id}/cancel`, {});
      if (res?.success) {
        const successMessage = order.status === 'PREPARING'
          ? 'Đã gửi yêu cầu hủy đến shop'
          : 'Đã hủy đơn hàng';
        message.success(successMessage);
        fetchOrders();
      } else {
        message.error(res?.message || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể hủy đơn hàng';
      message.error(errorMessage);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (value) => <Text code>{value}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (value) => <Text strong>${parseFloat(value || 0).toFixed(2)}</Text>
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleString()
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => navigate(`/orders/${record.id}`)}>Xem chi tiết</Button>
          {canCancelDirectly(record) && (
            <Button danger loading={cancellingOrderId === record.id} onClick={() => handleCancel(record)}>
              Hủy đơn
            </Button>
          )}
          {canRequestCancel(record) && (
            <Button danger loading={cancellingOrderId === record.id} onClick={() => handleCancel(record)}>
              Yêu cầu hủy
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="orders-page">
      <Title level={3}>Theo dõi đơn hàng</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default OrdersPage;
