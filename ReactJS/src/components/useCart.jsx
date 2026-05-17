import { useContext } from 'react';
import { ProductContext } from './context/ProductContext';

export function useCart() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useCart must be used within ProductProvider');
  }

  return {
    cart: context.state.cart,
    addToCart: context.addToCart,
    removeFromCart: context.removeFromCart,
    updateCartQuantity: context.updateCartQuantity,
    clearCart: context.clearCart,
    cartTotal: context.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    cartItemCount: context.state.cart.reduce((count, item) => count + item.quantity, 0)
  };
}
