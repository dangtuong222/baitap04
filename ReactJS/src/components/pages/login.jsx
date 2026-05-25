import React, { useContext } from 'react';
import { Button, Col, Divider, Form, Input, notification, Row } from 'antd';
import { loginApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { ArrowLeftOutlined } from '@ant-design/icons';

const LoginPage = () => {
    const navigate = useNavigate();
    const { dispatch } = useContext(AuthContext);

    const onFinish = async (values) => {
        const { email, password } = values;

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
    };

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
                            <Button type="primary" htmlType="submit">
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                    <Divider />
                    <div style={{ textAlign: "center" }}>
                        Chưa có tài khoản? <Link to={"/register"}>Đăng ký tại đây</Link>
                    </div>
                </fieldset>
            </Col>
        </Row>
    );
};

export default LoginPage;