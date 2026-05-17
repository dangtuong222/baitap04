import React, { useState } from 'react';
import { Button, InputNumber, Space, message } from 'antd';
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import './QuantitySelector.css';

const QuantitySelector = ({ stock, onAddToCart, loading = false }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value) => {
    if (value < 1) {
      setQuantity(1);
    } else if (value > stock) {
      message.warning(`Số lượng không thể vượt quá tồn kho: ${stock}`);
      setQuantity(stock);
    } else {
      setQuantity(value);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    } else {
      message.warning(`Số lượng không thể vượt quá tồn kho: ${stock}`);
    }
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart?.(quantity);
      setQuantity(1);
    }
  };

  return (
    <div className="quantity-selector">
      <div className="quantity-input-group">
        <span className="quantity-label">Số lượng:</span>
        <Space.Compact>
          <Button 
            icon={<MinusOutlined />} 
            onClick={handleDecrement}
            disabled={quantity <= 1 || loading}
          />
          <InputNumber
            value={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={stock}
            disabled={loading}
            className="quantity-input"
          />
          <Button 
            icon={<PlusOutlined />} 
            onClick={handleIncrement}
            disabled={quantity >= stock || loading}
          />
        </Space.Compact>
        <span className="stock-info">
          (Tồn kho: <strong>{stock}</strong>)
        </span>
      </div>

      <Button
        type="primary"
        size="large"
        icon={<ShoppingCartOutlined />}
        block
        onClick={handleAddToCart}
        loading={loading}
        disabled={stock === 0 || loading}
        className="add-to-cart-btn"
      >
        Thêm vào giỏ hàng
      </Button>
    </div>
  );
};

export default QuantitySelector;
