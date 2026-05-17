import express from 'express';
import productController from '../controllers/productController.js';
import categoryController from '../controllers/categoryController.js';
import searchController from '../controllers/searchController.js';
import promotionController from '../controllers/promotionController.js';

const router = express.Router();

// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductDetail);
router.get('/products/:id/similar', productController.getSimilarProducts);
router.get('/categories/:categoryId/products', productController.getProductsByCategory);

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryDetail);

// Search route
router.get('/search', searchController.searchProducts);

// Promotion routes
router.get('/promotions', promotionController.getPromotions);
router.get('/promotions/:id', promotionController.getPromotionDetail);

export default router;
