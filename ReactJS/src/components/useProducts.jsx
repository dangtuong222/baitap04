import { useContext } from 'react';
import { ProductContext } from './context/ProductContext';

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }

  return {
    products: context.state.products,
    loading: context.state.loading,
    error: context.state.error,
    pagination: context.state.pagination,
    fetchProducts: context.fetchProducts
  };
}
