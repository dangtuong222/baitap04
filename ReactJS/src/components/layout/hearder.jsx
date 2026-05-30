import React, { useContext, useMemo } from 'react';
import { HomeOutlined, SettingOutlined, ShoppingCartOutlined, ProfileOutlined, HeartOutlined } from '@ant-design/icons';
import { Badge, Menu, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { useCart } from '../useCart';
import { logoutApi } from '../util/api';

const Header = () => {

    const navigate = useNavigate();
    const { auth, dispatch } = useContext(AuthContext);
    const { cartItemCount } = useCart();
    const location = useLocation();
    const isAdmin = auth?.user?.role === 'admin';

        const current = useMemo(() => {
            if (location.pathname.startsWith('/admin')) return 'admin-dashboard';
            if (location.pathname.startsWith('/cart')) return 'cart';
            if (location.pathname.startsWith('/favorites')) return 'favorites';
            if (location.pathname.startsWith('/orders')) return 'orders';
            if (location.pathname.startsWith('/search')) return 'search';
            if (location.pathname.startsWith('/product')) return 'product';
            return 'home';
        }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || 'Không thể đăng xuất');
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_info");
            dispatch({ type: 'LOGOUT' });
            navigate("/login");
        }
    };

    const items = [
        {
            label: <Link to="/home">Trang chủ</Link>,
            key: 'home',
            icon: <HomeOutlined />,
        },
        ...(isAdmin ? [{
            label: <Link to="/admin/dashboard">Quản lý đơn</Link>,
            key: 'admin-dashboard',
            icon: <ProfileOutlined />,
        }] : []),
        ...(!isAdmin && auth.isAuthenticated ? [{
            label: (
                <Link to="/cart">
                    <Badge count={cartItemCount} size="small">
                        Giỏ hàng
                    </Badge>
                </Link>
            ),
            key: 'cart',
            icon: <ShoppingCartOutlined />,
        }] : []),
        ...(!isAdmin && auth.isAuthenticated ? [{
            label: <Link to="/favorites">Yêu thích</Link>,
            key: 'favorites',
            icon: <HeartOutlined />,
        }] : []),
        ...(!isAdmin && auth.isAuthenticated ? [{
            label: <Link to="/orders">Đơn hàng</Link>,
            key: 'orders',
            icon: <ProfileOutlined />,
        }] : []),

        {
            label: `Welcome ${auth?.user?.email ?? ""}`,
            key: 'SubMenu',
            icon: <SettingOutlined />,
            children: [
                ...(auth.isAuthenticated ? [
                    {
                        label: <Link to="/profile">Chỉnh sửa hồ sơ</Link>,
                        key: 'profile',
                        icon: <ProfileOutlined />,
                    },
                    {
                        label: <span onClick={() => {
                            handleLogout();
                        }}>Đăng xuất</span>,
                        key: 'logout',
                    }
                ] : [
                    {
                        label: <Link to="/login">Đăng nhập</Link>,
                        key: 'login',
                    }
                ]),
            ],
        },
    ];

    const onClick = () => {};

    return <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />;
};
export default Header;
