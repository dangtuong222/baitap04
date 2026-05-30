import React, { useContext, useMemo, useState } from 'react';
import { Button, Col, Divider, Form, Input, Modal, notification, Row, Space, Typography } from 'antd';
import { forgotPasswordApi, loginApi, resendForgotPasswordOtpApi, resetPasswordApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { ArrowLeftOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Text, Link: AntLink } = Typography;

const LoginPage = () => {
    const navigate = useNavigate();
    const { dispatch } = useContext(AuthContext);
    const [loginForm] = Form.useForm();
    const [forgotForm] = Form.useForm();
    const [resetForm] = Form.useForm();
    const [loginLoading, setLoginLoading] = useState(false);
    const [forgotVisible, setForgotVisible] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [forgotContext, setForgotContext] = useState({ email: '', tempToken: '' });

    const getApiErrorMessage = (error, fallbackMessage) => {
        const responseData = error?.response?.data;

        if (responseData?.errors?.length) {
            return responseData.errors
                .map((item) => `${item.field}: ${item.message}`)
                .join('\n');
        }

        return responseData?.message || error?.message || fallbackMessage;
    };

    const openForgotPassword = () => {
        setForgotVisible(true);
        setForgotStep(1);
        setForgotContext({ email: '', tempToken: '' });
        forgotForm.resetFields();
        resetForm.resetFields();
    };

    const closeForgotPassword = () => {
        setForgotVisible(false);
        setForgotStep(1);
        setForgotContext({ email: '', tempToken: '' });
    };

    const onFinish = async (values) => {
        const { email, password } = values;

        setLoginLoading(true);
        try {
            const res = await loginApi(email, password);

            if (res && res.token) {
                const userData = {
                    email,
                    name: res?.name || '',
                    role: res?.role || 'user',
                };
                localStorage.setItem("access_token", res.token);
                localStorage.setItem("user_info", JSON.stringify(userData));
                dispatch({
                    type: 'LOGIN',
                    payload: {
                        user: userData,
                        token: res.token,
                    },
                });

                notification.success({
                    message: "Đăng nhập thành công",
                    description: "Bạn đã đăng nhập vào hệ thống.",
                });

                navigate(res.redirectURI || '/');
            } else {
                notification.error({
                    message: "Đăng nhập thất bại",
                    description: res?.message || 'Sai email hoặc mật khẩu',
                });
            }
        } catch (error) {
            notification.error({
                message: "Đăng nhập thất bại",
                description: getApiErrorMessage(error, 'Sai email hoặc mật khẩu'),
            });
        } finally {
            setLoginLoading(false);
        }
    };

    const handleForgotSubmit = async () => {
        try {
            const { email } = await forgotForm.validateFields();
            setForgotLoading(true);

            const res = await forgotPasswordApi(email);
            const tempToken = res?.tempToken || '';

            setForgotContext({ email, tempToken });
            setForgotStep(2);
            resetForm.setFieldsValue({ email, otp: '', newPassword: '', confirmPassword: '' });

            notification.success({
                message: 'Gửi OTP thành công',
                description: res?.message || 'Vui lòng kiểm tra hộp thư của bạn.',
            });
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: getApiErrorMessage(error, 'Không thể gửi OTP đặt lại mật khẩu.'),
            });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetSubmit = async () => {
        try {
            const values = await resetForm.validateFields();
            setForgotLoading(true);

            const res = await resetPasswordApi(
                forgotContext.email,
                values.otp,
                forgotContext.tempToken,
                values.newPassword,
                values.confirmPassword
            );

            notification.success({
                message: 'Đặt lại mật khẩu thành công',
                description: res?.message || 'Mật khẩu của bạn đã được cập nhật.',
            });

            closeForgotPassword();
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: getApiErrorMessage(error, 'Không thể đặt lại mật khẩu.'),
            });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResendForgotOtp = async () => {
        try {
            setResendLoading(true);
            const res = await resendForgotPasswordOtpApi(forgotContext.email);
            notification.success({
                message: 'Đã gửi lại OTP',
                description: res?.message || 'Vui lòng kiểm tra hộp thư của bạn.',
            });
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: getApiErrorMessage(error, 'Không thể gửi lại OTP.'),
            });
        } finally {
            setResendLoading(false);
        }
    };

    const forgotStepTitle = useMemo(() => (
        forgotStep === 1 ? 'Quên mật khẩu - Gửi OTP' : 'Quên mật khẩu - Đặt lại mật khẩu'
    ), [forgotStep]);

    return (
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
                    <legend>Đăng Nhập</legend>
                    <Form
                        form={loginForm}
                        name="basic"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout='vertical'
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your email!',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your password!',
                                },
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loginLoading} block>
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                    <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>
                        <AntLink onClick={openForgotPassword}>Quên mật khẩu?</AntLink>
                    </div>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                    <Divider />
                    <div style={{ textAlign: "center" }}>
                        Chưa có tài khoản? <Link to={"/register"}>Đăng ký tại đây</Link>
                    </div>
                </fieldset>
            </Col>

            <Modal
                title={forgotStepTitle}
                open={forgotVisible}
                onCancel={closeForgotPassword}
                footer={null}
                destroyOnClose
            >
                {forgotStep === 1 ? (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Text type="secondary">
                            Nhập email tài khoản, hệ thống sẽ gửi mã OTP để bạn đặt lại mật khẩu.
                        </Text>
                        <Form form={forgotForm} layout="vertical" onFinish={handleForgotSubmit}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="example@email.com" />
                            </Form.Item>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button type="primary" htmlType="submit" loading={forgotLoading} block>
                                    Gửi OTP
                                </Button>
                            </Form.Item>
                        </Form>
                    </Space>
                ) : (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Text type="secondary">
                            OTP đã được gửi tới <Text strong>{forgotContext.email}</Text>. Nhập mã OTP và mật khẩu mới để hoàn tất.
                        </Text>
                        <Form form={resetForm} layout="vertical" onFinish={handleResetSubmit}>
                            <Form.Item
                                label="Email"
                                name="email"
                                initialValue={forgotContext.email}
                            >
                                <Input prefix={<MailOutlined />} disabled />
                            </Form.Item>
                            <Form.Item
                                label="Mã OTP"
                                name="otp"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập OTP!' },
                                    { len: 6, message: 'OTP phải gồm 6 chữ số!' },
                                ]}
                            >
                                <Input placeholder="Nhập 6 chữ số" maxLength={6} />
                            </Form.Item>
                            <Form.Item
                                label="Mật khẩu mới"
                                name="newPassword"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                            </Form.Item>
                            <Form.Item
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                            </Form.Item>
                            <Form.Item style={{ marginBottom: 12 }}>
                                <Button type="primary" htmlType="submit" loading={forgotLoading} block>
                                    Đặt lại mật khẩu
                                </Button>
                            </Form.Item>
                        </Form>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button onClick={handleResendForgotOtp} loading={resendLoading} block>
                                Gửi lại OTP
                            </Button>
                            <Button onClick={() => setForgotStep(1)} block>
                                Đổi email
                            </Button>
                        </Space>
                    </Space>
                )}
            </Modal>
        </Row>
    );
};

export default LoginPage;