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

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

    // Validate price range
    let minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    let maxPriceNum = maxPrice ? parseFloat(maxPrice) : 10000000;
    if (minPriceNum > maxPriceNum) {
      [minPriceNum, maxPriceNum] = [maxPriceNum, minPriceNum]; // Swap if inverted
    }

    // Search query
    if (q) {
      where.name = { [Op.like]: `%${q}%` };
    }

    // Category filter
    if (category) {
      where.categoryId = category;
    }

    // Price range filter with validation
    const priceFilters = {};
    if (minPriceNum > 0) priceFilters[Op.gte] = minPriceNum;
    if (maxPriceNum < 10000000) priceFilters[Op.lte] = maxPriceNum;
    if (Object.keys(priceFilters).length > 0) {
      where.price = priceFilters;
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
      case 'viewed':
      case 'most-viewed':
        order.push(['viewCount', 'DESC']);
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
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
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
        query: q,
        category,
        priceRange: { min: minPriceNum, max: maxPriceNum },
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
