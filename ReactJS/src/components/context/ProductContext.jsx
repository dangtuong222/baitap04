import React, { createContext, useReducer, useCallback } from 'react';
import axiosClient from '../util/axios.customize.js';

export const ProductContext = createContext();

const initialState = {
  products: [],
  categories: [],
  promotions: [],
  priceRange: [0, 10000000], // ✅ Dynamic price range from API
  filters: {
    query: '',
    category: null,
    priceRange: [0, 10000000],
    rating: null,
    sort: 'latest',
    page: 1,
    limit: 12
  },
  pagination: {
    current: 1,
    pageSize: 12,
    total: 0
  },
  loading: false,
  error: null,
  cart: [],
  apiCache: {}
};

const actionTypes = {
  SET_PRODUCTS: 'SET_PRODUCTS',
  APPEND_PRODUCTS: 'APPEND_PRODUCTS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_PROMOTIONS: 'SET_PROMOTIONS',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PRICE_RANGE: 'SET_PRICE_RANGE', // ✅ New action
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_QUANTITY: 'UPDATE_CART_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_CACHE: 'SET_CACHE'
};

const mergeProducts = (existing, incoming) => {
  return Array.from(
    new Map([...existing, ...incoming].map((product) => [product.id, product])).values()
  );
};

function productReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload };

    case actionTypes.APPEND_PRODUCTS:
      return { ...state, products: mergeProducts(state.products, action.payload) };
    
    case actionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    
    case actionTypes.SET_PROMOTIONS:
      return { ...state, promotions: action.payload };
    
    case actionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case actionTypes.SET_PAGINATION:
      return { ...state, pagination: action.payload };
    
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case actionTypes.SET_PRICE_RANGE: // ✅ Handle dynamic price range
      return { ...state, priceRange: action.payload, filters: { ...state.filters, priceRange: action.payload } };
    
    case actionTypes.ADD_TO_CART: {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
              : item
          )
        };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }] };
    }
    
    case actionTypes.REMOVE_FROM_CART:
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    
    case actionTypes.UPDATE_CART_QUANTITY:
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    case actionTypes.CLEAR_CART:
      return { ...state, cart: [] };
    
    case actionTypes.SET_CACHE:
      return {
        ...state,
        apiCache: { ...state.apiCache, [action.payload.key]: action.payload.value }
      };
    
    default:
      return state;
  }
}

export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(productReducer, initialState);

  // ✅ NEW: Fetch dynamic price range from API
  const fetchPriceRange = useCallback(async () => {
    if (state.apiCache.priceRange) {
      const range = [state.apiCache.priceRange.minPrice, state.apiCache.priceRange.maxPrice];
      dispatch({ type: actionTypes.SET_PRICE_RANGE, payload: range });
      return;
    }
    try {
      const res = await axiosClient.get('/api/products/price-range');
      if (res.success) {
        const range = [res.data.minPrice, res.data.maxPrice];
        dispatch({ type: actionTypes.SET_PRICE_RANGE, payload: range });
        dispatch({
          type: actionTypes.SET_CACHE,
          payload: { key: 'priceRange', value: res.data }
        });
      }
    } catch (error) {
      console.error('Error fetching price range:', error);
    }
  }, [state.apiCache.priceRange]);

  // ✅ UPDATED: fetchProducts with standardized parameter names
  const fetchProducts = useCallback(async (filters = {}, options = {}) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const params = {
        q: filters.query || '',
        search: filters.query || '',
        category: filters.category,
        minPrice: filters.priceRange?.[0] || 0,
        maxPrice: filters.priceRange?.[1] || state.priceRange[1],
        rating: filters.rating,
        sort: filters.sort || 'latest',
        page: filters.page || 1,
        limit: filters.limit || 12
      };

      // ✅ Always use /api/products endpoint (both support all filters now)
      const res = await axiosClient.get('/api/products', { params });

      if (res.success) {
        const shouldAppend = options.append === true;
        if (shouldAppend) {
          dispatch({ type: actionTypes.APPEND_PRODUCTS, payload: res.data });
        } else {
          dispatch({ type: actionTypes.SET_PRODUCTS, payload: res.data });
        }
        dispatch({
          type: actionTypes.SET_PAGINATION,
          payload: {
            current: res.pagination.currentPage,
            pageSize: res.pagination.itemsPerPage,
            total: res.pagination.totalItems
          }
        });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: null });
    } catch (error) {
      console.error('Error fetching products:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [state.priceRange]);

  const fetchCategories = useCallback(async () => {
    if (state.apiCache.categories) {
      dispatch({ type: actionTypes.SET_CATEGORIES, payload: state.apiCache.categories });
      return;
    }
    try {
      const res = await axiosClient.get('/api/categories');
      if (res.success) {
        dispatch({ type: actionTypes.SET_CATEGORIES, payload: res.data });
        dispatch({
          type: actionTypes.SET_CACHE,
          payload: { key: 'categories', value: res.data }
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [state.apiCache.categories]);

  const fetchPromotions = useCallback(async () => {
    if (state.apiCache.promotions) {
      dispatch({ type: actionTypes.SET_PROMOTIONS, payload: state.apiCache.promotions });
      return;
    }

    try {
      dispatch({ type: actionTypes.SET_PROMOTIONS, payload: [] });
    } catch (error) {
      console.error('Error fetching promotions:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, [state.apiCache.promotions]);

  const setFilters = useCallback((newFilters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: newFilters });
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    dispatch({
      type: actionTypes.ADD_TO_CART,
      payload: { ...product, quantity }
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({
      type: actionTypes.REMOVE_FROM_CART,
      payload: productId
    });
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    dispatch({
      type: actionTypes.UPDATE_CART_QUANTITY,
      payload: { id: productId, quantity }
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_CART });
  }, []);

  const value = {
    state,
    dispatch,
    fetchProducts,
    fetchPriceRange,
    fetchCategories,
    fetchPromotions,
    setFilters,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}
