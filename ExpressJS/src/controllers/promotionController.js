import db from '../models/index.js';
import { Op } from 'sequelize';

const Promotion = db.Promotion;
const Product = db.Product;

// Get active promotions
const getPromotions = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const promotions = await Promotion.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate }
      },
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'price', 'stock']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving promotions',
      error: error.message
    });
  }
};

// Get promotion by ID
const getPromotionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id, {
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'price', 'description', 'stock']
        }
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving promotion detail',
      error: error.message
    });
  }
};

export default {
  getPromotions,
  getPromotionDetail
};
