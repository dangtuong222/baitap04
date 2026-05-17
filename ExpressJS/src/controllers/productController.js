import db from '../models/index.js';
import { Op } from 'sequelize';

const Product = db.Product;
const Category = db.Category;
const ProductImage = db.ProductImage;
const Promotion = db.Promotion;

// Get all products with filtering, sorting, and pagination
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      sort = 'latest',
      minPrice,
      maxPrice,
      rating
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const order = [];

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Search by name
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    // Filter by rating
    if (rating) {
      where.rating = { [Op.gte]: rating };
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
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
  getProductDetail,
  getSimilarProducts,
  getProductsByCategory
};
