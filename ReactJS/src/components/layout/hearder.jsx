import React, { useContext, useState } from 'react';
import { UsergroupAddOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

const Header = () => {

    const navigate = useNavigate();
    const { auth, dispatch } = useContext(AuthContext);
    const [current, setCurrent] = useState('mail');
    console.log(">>> check auth: ", auth);
    const items = [
        {
            label: <Link to="/">Home Page</Link>,
            key: 'home',
            icon: <HomeOutlined />,
        },
        ...(auth.isAuthenticated ? [{
            label: <Link to="/user">Users</Link>,
            key: 'user',
            icon: <UsergroupAddOutlined />,
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
    const [current, setCurrent] = useState('mail');
    const onClick = (e) => {
        console.log('click ', e);
        setCurrent(e.key);
    };
    return <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />;
};
export default Header;