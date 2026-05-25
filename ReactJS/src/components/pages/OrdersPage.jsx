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

  const handleCancel = async (orderId) => {
    const res = await axiosClient.post(`/api/orders/${orderId}/cancel`);
    if (res?.success) {
      message.success('Yêu cầu hủy đơn đã được cập nhật');
      fetchOrders();
    } else {
      message.error(res?.message || 'Không thể hủy đơn hàng');
    }
  };

  const isCancelable = (order) => {
    const createdAt = new Date(order.createdAt);
    const diffMinutes = (Date.now() - createdAt.getTime()) / (60 * 1000);
    return ['NEW', 'CONFIRMED'].includes(order.status) && diffMinutes <= 30;
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
          {isCancelable(record) && (
            <Button danger onClick={() => handleCancel(record.id)}>Hủy đơn</Button>
          )}
          {record.status === 'PREPARING' && (
            <Button danger onClick={() => handleCancel(record.id)}>Yêu cầu hủy</Button>
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
