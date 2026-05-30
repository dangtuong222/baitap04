import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, notification, Row, Spin } from 'antd';
import { getProfileApi, updateProfileApi } from '../util/api';

const EditProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProfileApi();
        if (res && res.success && res.data) {
          form.setFieldsValue(res.data);
        }
      } catch (err) {
        notification.error({ message: 'Lỗi', description: err?.message || 'Không lấy được thông tin.' });
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await updateProfileApi(values);
      if (res && res.success) {
        notification.success({ message: 'Cập nhật thành công', description: res.message || 'Thông tin đã được cập nhật.' });
      } else {
        notification.error({ message: 'Lỗi', description: res?.message || 'Cập nhật thất bại.' });
      }
    } catch (err) {
      notification.error({ message: 'Lỗi', description: err?.message || 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={fetching}>
      <Row justify="center" style={{ marginTop: 30 }}>
        <Col xs={24} md={16} lg={10}>
          <fieldset style={{ padding: 24, borderRadius: 12 }}>
            <legend>Chỉnh sửa hồ sơ</legend>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên.' }]}>
                <Input />
              </Form.Item>

              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ">
                <Input />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </fieldset>
        </Col>
      </Row>
    </Spin>
  );
};

export default EditProfile;
