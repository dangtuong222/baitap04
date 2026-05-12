import React, { useState, useEffect } from 'react';
import { Button, Col, Form, Input, notification, Row, Spin } from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { verifyRegisterOtpApi, resendRegisterOtpApi } from '../util/api';

const RegisterStep2 = ({ email, onBack }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(300); // 5 phút
    const navigate = useNavigate();

    useEffect(() => {
        if (timer <= 0) return;
        
        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const onFinish = async (values) => {
        const { otp } = values;
        setLoading(true);
        try {
            const res = await verifyRegisterOtpApi(email, otp);

            if (res && res.success) {
                notification.success({
                    message: "Đăng ký thành công",
                    description: res.message || "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
                });
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                notification.error({
                    message: "Lỗi",
                    description: res?.message || 'OTP không chính xác, vui lòng thử lại.',
                });
            }
        } catch (error) {
            notification.error({
                message: "Lỗi",
                description: error?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            const res = await resendRegisterOtpApi(email);

            if (res && res.success) {
                notification.success({
                    message: "Gửi lại OTP thành công",
                    description: res.message || "Vui lòng kiểm tra hộp thư của bạn.",
                });
                setTimer(300);
            } else {
                notification.error({
                    message: "Lỗi",
                    description: res?.message || 'Gửi lại OTP thất bại, vui lòng thử lại.',
                });
            }
        } catch (error) {
            notification.error({
                message: "Lỗi",
                description: error?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
            });
        } finally {
            setResendLoading(false);
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
                        <legend>Đăng Ký - Bước 2: Xác nhận OTP</legend>
                        
                        <div style={{
                            padding: "16px",
                            marginBottom: "20px",
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            borderRadius: "8px",
                            border: "1px solid rgba(37, 99, 235, 0.3)"
                        }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>
                                <MailOutlined /> Mã OTP đã được gửi tới: <strong>{email}</strong>
                            </p>
                        </div>

                        <Form
                            form={form}
                            name="registerStep2"
                            onFinish={onFinish}
                            autoComplete="off"
                            layout='vertical'
                        >
                            <Form.Item
                                label="Mã OTP"
                                name="otp"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mã OTP!',
                                    },
                                    {
                                        pattern: /^[0-9]{6}$/,
                                        message: 'Mã OTP phải gồm 6 chữ số!',
                                    }
                                ]}
                            >
                                <Input
                                    placeholder="Nhập 6 chữ số"
                                    maxLength="6"
                                    style={{ fontSize: "20px", letterSpacing: "4px", textAlign: "center" }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block loading={loading}>
                                    Xác nhận & Hoàn tất đăng ký
                                </Button>
                            </Form.Item>
                        </Form>

                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <p style={{ fontSize: "14px", color: "#666" }}>
                                Mã OTP hết hạn trong: <strong style={{ color: timer < 60 ? "#ff4d4f" : "#2563eb" }}>{formatTime(timer)}</strong>
                            </p>
                        </div>

                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <Button
                                type="dashed"
                                onClick={handleResendOtp}
                                disabled={timer > 0 || resendLoading}
                                loading={resendLoading}
                            >
                                {timer > 0 ? `Gửi lại OTP (${formatTime(timer)})` : 'Gửi lại OTP'}
                            </Button>
                        </div>

                        <div style={{ textAlign: "center", borderTop: "1px solid #ddd", paddingTop: "16px" }}>
                            <Button
                                type="link"
                                onClick={onBack}
                                icon={<ArrowLeftOutlined />}
                            >
                                Quay lại
                            </Button>
                        </div>
                    </fieldset>
                </Col>
            </Row>
        </Spin>
    );
};

export default RegisterStep2;
