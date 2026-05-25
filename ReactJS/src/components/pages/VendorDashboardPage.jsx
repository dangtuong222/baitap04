import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography
} from 'antd';
import { ReloadOutlined, EyeOutlined, CheckOutlined, CompassOutlined, CarOutlined, GiftOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../util/axios.customize.js';
import './VendorDashboardPage.css';

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

const statusFlow = ['NEW', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'];

const transitions = {
  NEW: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['PREPARING', 'CANCELED'],
  PREPARING: ['SHIPPING', 'CANCEL_REQUESTED'],
  SHIPPING: ['DELIVERED'],
  CANCEL_REQUESTED: ['CANCELED', 'PREPARING']
};

const actionMeta = {
  CONFIRMED: { label: 'Xác nhận đơn', icon: <CheckOutlined /> },
  PREPARING: { label: 'Chuẩn bị hàng', icon: <GiftOutlined /> },
  SHIPPING: { label: 'Bắt đầu giao', icon: <CarOutlined /> },
  DELIVERED: { label: 'Đã giao', icon: <CompassOutlined /> },
  CANCELED: { label: 'Hủy đơn', icon: <StopOutlined /> },
  CANCEL_REQUESTED: { label: 'Chấp nhận yêu cầu hủy', icon: <StopOutlined /> }
};

const getCustomerLabel = (order) => {
  const firstName = order?.user?.firstName || '';
  const lastName = order?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || order?.user?.email || `Khách #${order?.userId || ''}`;
};

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [nextStatus, setNextStatus] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/orders');
      if (res?.success) {
        setOrders(res.data || []);
      } else {
        message.error(res?.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const summary = useMemo(() => {
    const base = { total: orders.length, revenue: 0 };
    const counts = Object.fromEntries(Object.keys(statusMap).map((key) => [key, 0]));

    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
      base.revenue += Number(order.total || 0);
    });

    return { ...base, ...counts };
  }, [orders]);

  const allowedTransitions = (status) => transitions[status] || [];

  const openDrawer = (order) => {
    const available = allowedTransitions(order.status);
    setSelectedOrder(order);
    setNextStatus(available[0] || null);
    setDrawerOpen(true);
  };

  const refreshSelectedOrder = async (orderId) => {
    const res = await axiosClient.get(`/api/orders/${orderId}`);
    if (res?.success) {
      setSelectedOrder(res.data);
      setNextStatus(allowedTransitions(res.data.status)[0] || null);
    }
  };

  const handleChangeStatus = async (orderId, status) => {
    if (!status) {
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const res = await axiosClient.patch(`/api/orders/${orderId}/status`, { status });
      if (res?.success) {
        message.success(`Đã cập nhật trạng thái sang ${statusMap[status]?.label || status}`);
        await fetchOrders();
        await refreshSelectedOrder(orderId);
      } else {
        message.error(res?.message || 'Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrderId(null);
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
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div><Text strong>{getCustomerLabel(record)}</Text></div>
          <Text type="secondary">{record?.user?.email || record?.phoneNumber}</Text>
        </div>
      )
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
      title: 'Thanh toán',
      key: 'payment',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.paymentMethod === 'COD' ? 'blue' : 'processing'}>{record.paymentMethod}</Tag>
          <Text type="secondary">{record.paymentStatus}</Text>
        </Space>
      )
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
      render: (_, record) => {
        const nextStatuses = allowedTransitions(record.status);
        return (
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => openDrawer(record)}>Chi tiết</Button>
            {nextStatuses.map((status) => {
              const meta = actionMeta[status] || { label: status, icon: <CheckOutlined /> };
              return (
                <Button
                  key={status}
                  type={status === 'CANCELED' ? 'default' : 'primary'}
                  danger={status === 'CANCELED'}
                  icon={meta.icon}
                  loading={updatingOrderId === record.id}
                  onClick={() => handleChangeStatus(record.id, status)}
                >
                  {meta.label}
                </Button>
              );
            })}
          </Space>
        );
      }
    }
  ];

  const stepItems = selectedOrder
    ? statusFlow.map((status) => ({
        title: statusMap[status]?.label || status,
        description: status === 'NEW'
          ? (selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : null)
          : (selectedOrder[`${status.toLowerCase()}At`] ? new Date(selectedOrder[`${status.toLowerCase()}At`]).toLocaleString() : null)
      }))
    : [];

  return (
    <div className="vendor-dashboard-page">
      <div className="vendor-hero">
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>Bảng điều khiển Vendor</Title>
          <Text type="secondary">
            Quản lý xác nhận, chuẩn bị, giao hàng và xử lý hủy đơn từ một màn hình duy nhất.
          </Text>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
          Làm mới
        </Button>
      </div>

      <Row gutter={[16, 16]} className="summary-grid">
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card">
            <Statistic title="Tổng đơn" value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card">
            <Statistic title="Doanh thu" value={summary.revenue} precision={2} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card">
            <Statistic title="Chờ xác nhận" value={summary.NEW + summary.CONFIRMED} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card">
            <Statistic title="Đang xử lý" value={summary.PREPARING + summary.SHIPPING} />
          </Card>
        </Col>
      </Row>

      <Card className="orders-card" title="Danh sách đơn hàng">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="Chưa có đơn hàng nào" /> }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={selectedOrder ? `Đơn hàng ${selectedOrder.id}` : 'Chi tiết đơn hàng'}
        open={drawerOpen}
        width={720}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedOrder && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Khách hàng">{getCustomerLabel(selectedOrder)}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedOrder?.user?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{selectedOrder.phoneNumber}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{selectedOrder.shippingAddress}</Descriptions.Item>
                <Descriptions.Item label="Thanh toán">{selectedOrder.paymentMethod}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái thanh toán">{selectedOrder.paymentStatus}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú">{selectedOrder.note || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Tiến trình xử lý">
              <Steps current={Math.max(0, statusFlow.indexOf(selectedOrder.status))} items={stepItems} />
            </Card>

            <Card title="Chuyển trạng thái">
              <Form layout="vertical">
                <Form.Item label="Trạng thái tiếp theo">
                  <Select
                    value={nextStatus}
                    onChange={setNextStatus}
                    options={allowedTransitions(selectedOrder.status).map((status) => ({
                      value: status,
                      label: statusMap[status]?.label || status
                    }))}
                  />
                </Form.Item>
                <Space>
                  <Button
                    type="primary"
                    disabled={!nextStatus}
                    loading={updatingOrderId === selectedOrder.id}
                    onClick={() => handleChangeStatus(selectedOrder.id, nextStatus)}
                  >
                    Cập nhật
                  </Button>
                  <Button onClick={() => navigate(`/orders/${selectedOrder.id}`)}>
                    Xem trang chi tiết
                  </Button>
                </Space>
              </Form>
            </Card>

            <Card title={`Sản phẩm (${selectedOrder.items?.length || 0})`}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {(selectedOrder.items || []).map((item) => (
                  <div key={item.id} className="vendor-item-row">
                    <div>
                      <Text strong>{item.product?.name}</Text>
                      <div><Text type="secondary">x{item.quantity}</Text></div>
                    </div>
                    <Text strong>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default VendorDashboardPage;