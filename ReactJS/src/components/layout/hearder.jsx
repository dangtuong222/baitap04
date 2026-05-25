import React, { useContext, useMemo } from 'react';
import { HomeOutlined, SettingOutlined, ShoppingCartOutlined, ProfileOutlined } from '@ant-design/icons';
import { Badge, Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { useCart } from '../useCart';

const Header = () => {

    const navigate = useNavigate();
    const { auth, dispatch } = useContext(AuthContext);
    const { cartItemCount } = useCart();
    const location = useLocation();

    const current = useMemo(() => {
        if (location.pathname.startsWith('/admin')) return 'admin-dashboard';
        if (location.pathname.startsWith('/cart')) return 'cart';
        if (location.pathname.startsWith('/orders')) return 'orders';
        if (location.pathname.startsWith('/search')) return 'search';
        if (location.pathname.startsWith('/product')) return 'product';
        return 'home';
    }, [location.pathname]);

    const items = [
        {
            label: <Link to="/home">Trang chủ</Link>,
            key: 'home',
            icon: <HomeOutlined />,
        },
        ...(auth?.user?.role === 'admin' ? [{
            label: <Link to="/admin/dashboard">Quản lý đơn</Link>,
            key: 'admin-dashboard',
            icon: <ProfileOutlined />,
        }] : []),
        ...(auth.isAuthenticated ? [{
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
        ...(auth.isAuthenticated ? [{
            label: <Link to="/orders">Đơn hàng</Link>,
            key: 'orders',
            icon: <ProfileOutlined />,
        }] : []),

        {
            label: `Welcome ${auth?.user?.email ?? ""}`,
            key: 'SubMenu',
            icon: <SettingOutlined />,
            children: [
                ...(auth.isAuthenticated ? [{
                    label: <span onClick={() => {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("user_info");
                        setCurrent("home");
                        dispatch({ type: 'LOGOUT' });
                        navigate("/login");
                    }}>Đăng xuất</span>,
                    key: 'logout',
                }] : [
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
