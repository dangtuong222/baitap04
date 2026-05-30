import db from '../models/index.js';
import { Op } from 'sequelize';

const Product = db.Product;
const Category = db.Category;
const ProductImage = db.ProductImage;
const Promotion = db.Promotion;
const Review = db.Review;
const Order = db.Order;
const OrderItem = db.OrderItem;
const Favorite = db.Favorite;
const ViewedProduct = db.ViewedProduct;

// ✅ NEW: Get price range from database
const getPriceRange = async (req, res) => {
  try {
    const priceData = await Product.findAll({
      attributes: [
        [db.sequelize.fn('MIN', db.sequelize.col('price')), 'minPrice'],
        [db.sequelize.fn('MAX', db.sequelize.col('price')), 'maxPrice']
      ],
      raw: true
    });

    const { minPrice = 0, maxPrice = 10000000 } = priceData[0] || {};

    res.status(200).json({
      success: true,
      data: {
        minPrice: parseInt(minPrice) || 0,
        maxPrice: parseInt(maxPrice) || 10000000
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving price range',
      error: error.message
    });
  }
};

// Get all products with filtering, sorting, and pagination
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      q,  // ✅ Support 'q' as well
      sort = 'latest',
      minPrice,
      maxPrice,
      rating
    } = req.query;

    // ✅ Support both 'search' and 'q' parameters
    const searchQuery = search || q || '';

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const where = {};
    const order = [];

    // ✅ Validate price range
    let minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    let maxPriceNum = maxPrice ? parseFloat(maxPrice) : 10000000;
    if (minPriceNum > maxPriceNum) {
      [minPriceNum, maxPriceNum] = [maxPriceNum, minPriceNum];
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // ✅ Search by name (both 'search' and 'q')
    if (searchQuery) {
      where.name = { [Op.like]: `%${searchQuery}%` };
    }

    // ✅ Filter by price range with validation
    const priceFilters = {};
    if (minPriceNum > 0) priceFilters[Op.gte] = minPriceNum;
    if (maxPriceNum < 10000000) priceFilters[Op.lte] = maxPriceNum;
    if (Object.keys(priceFilters).length > 0) {
      where.price = priceFilters;
    }

    // ✅ Filter by rating
    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    // Sort options
    switch(sort) {
      case 'latest':
        order.push(['createdAt', 'DESC']);
        break;
      case 'oldest':
        order.push(['createdAt', 'ASC']);
        break;
      case 'price-low':
        order.push(['price', 'ASC']);
        break;
      case 'price-high':
        order.push(['price', 'DESC']);
        break;
      case 'bestseller':
        order.push(['sold', 'DESC']);
        break;
      case 'rating':
        order.push(['rating', 'DESC']);
        break;
      case 'viewed':
      case 'most-viewed':
        order.push(['viewCount', 'DESC']);
        break;
      default:
        order.push(['createdAt', 'DESC']);
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'images', attributes: ['imageUrl', 'alt'] }
      ],
      order,
      limit: limitNum,
      offset,
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        itemsPerPage: limitNum
      },
      filters: {
        query: searchQuery,
        category,
        priceRange: { min: minPriceNum, max: maxPriceNum },
        rating,
        sort
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
};

// Get product detail
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { 
          association: 'category', 
          attributes: ['id', 'name', 'slug'] 
        },
        { 
          association: 'images', 
          attributes: ['id', 'imageUrl', 'alt', 'displayOrder'],
          order: [['displayOrder', 'ASC']]
        },
        {
          association: 'promotions',
          where: {
            isActive: true,
            startDate: { [Op.lte]: new Date() },
            endDate: { [Op.gte]: new Date() }
          },
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.increment('viewCount', { by: 1, where: { id } });
    product.viewCount = (product.viewCount || 0) + 1;

    if (req.user?.id) {
      const existingView = await ViewedProduct.findOne({
        where: { userId: req.user.id, productId: id }
      });
      if (existingView) {
        await existingView.update({
          viewCount: (existingView.viewCount || 0) + 1,
          lastViewedAt: new Date()
        });
      } else {
        await ViewedProduct.create({
          userId: req.user.id,
          productId: id,
          viewCount: 1,
          lastViewedAt: new Date()
        });
      }
    }

    const reviewStats = await Review.findAll({
      where: { productId: id },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'reviewCount']
      ],
      raw: true
    });

    const avgRating = parseFloat(reviewStats[0]?.avgRating || 0);
    const reviewCount = parseInt(reviewStats[0]?.reviewCount || 0, 10);

    const buyerCount = await Order.count({
      distinct: true,
      col: 'userId',
      where: { status: 'DELIVERED' },
      include: [
        {
          model: OrderItem,
          as: 'items',
          where: { productId: id }
        }
      ]
    });

    let isFavorite = false;
    if (req.user?.id) {
      const favorite = await Favorite.findOne({
        where: { userId: req.user.id, productId: id }
      });
      isFavorite = !!favorite;
    }

    product.setDataValue('reviewCount', reviewCount);
    product.setDataValue('buyerCount', buyerCount);
    product.setDataValue('isFavorite', isFavorite);
    product.setDataValue('rating', avgRating);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving product detail',
      error: error.message
    });
  }
};

// Get similar products
const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit || 5;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const similarProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: id }
      },
      include: [
        { association: 'images', attributes: ['imageUrl', 'alt'] }
      ],
      limit: parseInt(limit),
      order: [['sold', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: similarProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving similar products',
      error: error.message
    });
  }
};

// Get top bestsellers with pagination
const getTopBestsellers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'images', attributes: ['imageUrl', 'alt'] }
      ],
      order: [['sold', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving top bestsellers',
      error: error.message
    });
  }
};

// Get top most viewed with pagination
const getMostViewed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'images', attributes: ['imageUrl', 'alt'] }
      ],
      order: [['viewCount', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving most viewed products',
      error: error.message
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { count, rows } = await Product.findAndCountAll({
      where: { categoryId },
      include: [
        { association: 'images', attributes: ['imageUrl', 'alt'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving products by category',
      error: error.message
    });
  }
};

export default {
  getAllProducts,
  getPriceRange,
  getProductDetail,
  getSimilarProducts,
  getProductsByCategory,
  getTopBestsellers,
  getMostViewed
};
