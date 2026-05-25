import { useContext } from 'react';
import { ProductContext } from './context/ProductContext';

export function useCart() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useCart must be used within ProductProvider');
  }

  return {
    cart: context.state.cart,
    cartMeta: context.state.cartMeta,
    cartLoading: context.state.cartLoading,
    cartError: context.state.cartError,
    refreshCart: context.fetchCart,
    addToCart: context.addToCart,
    removeFromCart: context.removeFromCart,
    updateCartQuantity: context.updateCartQuantity,
    clearCart: context.clearCart,
    cartTotal: context.state.cart.reduce((total, item) => {
      const unitPrice = item.unitPrice ?? item.price ?? item.product?.price ?? 0;
      return total + (parseFloat(unitPrice) * item.quantity);
    }, 0),
    cartItemCount: context.state.cart.reduce((count, item) => count + item.quantity, 0)
  };
}
