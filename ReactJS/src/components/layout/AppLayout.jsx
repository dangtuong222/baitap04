import React from 'react';
import Header from './hearder.jsx';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">{children}</div>
    </div>
  );
};

export default AppLayout;
