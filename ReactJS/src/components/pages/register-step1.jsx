import React from 'react';
import { Button, Col, Form, Input, notification, Row, Spin } from 'antd';
import { ArrowLeftOutlined, MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { registerApi } from '../util/api';

const RegisterStep1 = ({ onNext, email: initialEmail = '' }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    const getApiErrorMessage = (error, fallbackMessage) => {
        const responseData = error?.response?.data;

        if (responseData?.errors?.length) {
            return responseData.errors
                .map((item) => `${item.field}: ${item.message}`)
                .join('\n');
        }

        return responseData?.message || error?.message || fallbackMessage;
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { email, password, firstName, lastName, phoneNumber } = values;
            
            const res = await registerApi(
                email,
                password,
                firstName,
                lastName,
                phoneNumber || ''
            );

            if (res && res.success) {
                notification.success({
                    message: "Gửi OTP thành công",
                    description: res.message || "Vui lòng kiểm tra hộp thư của bạn.",
                });
                onNext(email);
            } else {
                notification.error({
                    message: "Lỗi",
                    description: res?.message || 'Đăng ký thất bại, vui lòng thử lại.',
                });
            }
        } catch (error) {
            notification.error({
                message: "Lỗi",
                description: getApiErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại.'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Row justify={"center"} style={{ marginTop: "30px" }}>
                <Col xs={24} md={16} lg={8}>
                    <fieldset style={{
                        padding: "24px",
                        margin: "5px",
                        border: "1px solid rgba(37, 99, 235, 0.18)",
                        borderRadius: "18px",
                        background: "rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
                        backdropFilter: "blur(10px)"
                    }}>
                        <legend>Đăng Ký - Bước 1</legend>
                        <Form
                            form={form}
                            name="registerStep1"
                            onFinish={onFinish}
                            autoComplete="off"
                            layout='vertical'
                            initialValues={{ email: initialEmail }}
                        >
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập email!',
                                    },
                                    {
                                        type: 'email',
                                        message: 'Email không hợp lệ!',
                                    }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="example@email.com" disabled={!!initialEmail} />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mật khẩu!',
                                    },
                                    {
                                        min: 6,
                                        message: 'Mật khẩu phải ít nhất 6 ký tự!',
                                    },
                                    {
                                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Mật khẩu phải có chữ hoa, chữ thường và số!',
                                    }
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Ít nhất 6 ký tự (chữ hoa, thường, số)" />
                            </Form.Item>

                            <Form.Item
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng xác nhận mật khẩu!',
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                            </Form.Item>

                            <Form.Item
                                label="Họ (First Name)"
                                name="firstName"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập họ!',
                                    },
                                    {
                                        min: 2,
                                        message: 'Họ phải ít nhất 2 ký tự!',
                                    }
                                ]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Nguyễn (ví dụ)" />
                            </Form.Item>

                            <Form.Item
                                label="Tên (Last Name)"
                                name="lastName"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập tên!',
                                    },
                                    {
                                        min: 2,
                                        message: 'Tên phải ít nhất 2 ký tự!',
                                    }
                                ]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Văn A (ví dụ)" />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phoneNumber"
                                rules={[
                                    {
                                        pattern: /^(0[0-9]{9,10})$/,
                                        message: 'Số điện thoại không hợp lệ!',
                                    }
                                ]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="0123456789 (tùy chọn)" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Tiếp tục
                                </Button>
                            </Form.Item>
                        </Form>
                        <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                        <div style={{ textAlign: "center", marginTop: "16px" }}>
                            Đã có tài khoản? <Link to={"/login"}>Đăng nhập tại đây</Link>
                        </div>
                    </fieldset>
                </Col>
            </Row>
        </Spin>
    );
};

export default RegisterStep1;
