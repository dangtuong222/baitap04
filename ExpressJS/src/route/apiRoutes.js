import express from 'express';
import productController from '../controllers/productController.js';
import categoryController from '../controllers/categoryController.js';
import searchController from '../controllers/searchController.js';
import promotionController from '../controllers/promotionController.js';
import cartController from '../controllers/cartController.js';
import orderController from '../controllers/orderController.js';
import reviewController from '../controllers/reviewController.js';
import favoriteController from '../controllers/favoriteController.js';
import viewedController from '../controllers/viewedController.js';
import loyaltyController from '../controllers/loyaltyController.js';
import { authorize, verifyToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Test auth endpoint
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user, message: 'Auth working' });
});

// Product routes
router.get('/products/price-range', productController.getPriceRange);
router.get('/products/bestsellers', productController.getTopBestsellers);
router.get('/products/most-viewed', productController.getMostViewed);
router.get('/products/viewed', verifyToken, viewedController.getViewedProducts);
router.get('/products', productController.getAllProducts);
router.get('/products/:id', optionalAuth, productController.getProductDetail);
router.get('/products/:id/similar', productController.getSimilarProducts);
router.get('/products/:id/reviews', reviewController.getReviews);
router.get('/products/:id/review-eligibility', verifyToken, reviewController.getReviewEligibility);
router.post('/products/:id/reviews', verifyToken, reviewController.createReview);
router.get('/categories/:categoryId/products', productController.getProductsByCategory);

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryDetail);

// Search route
router.get('/search', searchController.searchProducts);

// Promotion routes
router.get('/promotions', promotionController.getPromotions);
router.get('/promotions/:id', promotionController.getPromotionDetail);

// Cart routes
router.get('/cart', verifyToken, cartController.getCart);
router.post('/cart/items', verifyToken, cartController.addItem);
router.put('/cart/items/:productId', verifyToken, cartController.updateItem);
router.delete('/cart/items/:productId', verifyToken, cartController.removeItem);
router.delete('/cart', verifyToken, cartController.clearCart);

// Favorites routes
router.get('/favorites', verifyToken, favoriteController.getFavorites);
router.get('/favorites/:productId', verifyToken, favoriteController.getFavoriteStatus);
router.post('/favorites', verifyToken, favoriteController.addFavorite);
router.delete('/favorites/:productId', verifyToken, favoriteController.removeFavorite);

// Loyalty routes
router.get('/loyalty/summary', verifyToken, loyaltyController.getSummary);

// Order routes
router.get('/orders/preview', verifyToken, orderController.previewOrder);
router.post('/orders', verifyToken, orderController.createOrder);
router.get('/orders', verifyToken, orderController.getOrders);
router.get('/orders/:id', verifyToken, orderController.getOrderDetail);
router.post('/orders/:id/cancel', verifyToken, orderController.cancelOrder);
router.patch('/orders/:id/status', verifyToken, authorize('admin'), orderController.updateStatus);

export default router;
