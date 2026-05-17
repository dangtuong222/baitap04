import db from '../models/index.js';

const Category = db.Category;
const Product = db.Product;

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          association: 'products',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    const formattedCategories = categories.map(cat => ({
      ...cat.toJSON(),
      productCount: cat.products ? cat.products.length : 0,
      products: undefined
    }));

    res.status(200).json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
};

// Get category detail
const getCategoryDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          association: 'products',
          attributes: ['id', 'name', 'price', 'sold'],
          limit: 10
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving category detail',
      error: error.message
    });
  }
};

export default {
  getAllCategories,
  getCategoryDetail
};
