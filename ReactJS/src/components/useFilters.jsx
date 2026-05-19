import { useContext } from 'react';
import { ProductContext } from './context/ProductContext';

export function useFilters() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useFilters must be used within ProductProvider');
  }

  return {
    filters: context.state.filters,
    setFilters: context.setFilters,
    fetchProducts: context.fetchProducts,
    categories: context.state.categories,
    priceRange: context.state.priceRange,
    fetchCategories: context.fetchCategories,
    fetchPriceRange: context.fetchPriceRange
  };
}
