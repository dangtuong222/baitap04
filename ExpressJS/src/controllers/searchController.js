import db from '../models/index.js';
import { Op } from 'sequelize';

const Product = db.Product;
const Category = db.Category;

// Search and filter products
const searchProducts = async (req, res) => {
  try {
    const { 
      q = '', 
      category, 
      minPrice,
      maxPrice,
      rating,
      sort = 'latest',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const order = [];

    // Search query
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }

    // Category filter
    if (category) {
      where.categoryId = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    // Sorting
    switch(sort) {
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
      case 'oldest':
        order.push(['createdAt', 'ASC']);
        break;
      case 'latest':
      default:
        order.push(['createdAt', 'DESC']);
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { 
          association: 'category', 
          attributes: ['id', 'name'] 
        },
        { 
          association: 'images', 
          attributes: ['imageUrl', 'alt'],
          limit: 1
        }
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
      },
      filters: {
        query: q,
        category,
        priceRange: { min: minPrice, max: maxPrice },
        rating,
        sort
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

export default {
  searchProducts
};
