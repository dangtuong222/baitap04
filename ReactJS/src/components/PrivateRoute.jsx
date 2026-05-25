import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthContext } from './context/auth.context';

const PrivateRoute = ({ children, allowedRoles }) => {
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

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles?.length) {
        const currentRole = auth?.user?.role;
        if (!currentRole || !allowedRoles.includes(currentRole)) {
            return <Navigate to="/home" replace />;
        }
    }

    return children;
};

export default PrivateRoute;
