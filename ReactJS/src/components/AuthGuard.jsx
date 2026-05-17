import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthContext } from './context/auth.context';

const AuthGuard = ({ children }) => {
    const { auth, appLoading } = useContext(AuthContext);

    if (appLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    // If user is authenticated, redirect to home
    if (auth.isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default AuthGuard;
