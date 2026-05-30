'use strict';
import db from '../models/index.js';

const { ViewedProduct, Product } = db;

const getViewedProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ViewedProduct.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            { association: 'images', attributes: ['imageUrl', 'alt'] },
            { association: 'category', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['lastViewedAt', 'DESC']],
      limit: limitNum,
      offset
    });

    const data = rows
      .filter((item) => item.product)
      .map((item) => ({
        ...item.product.toJSON(),
        lastViewedAt: item.lastViewedAt,
        viewCount: item.viewCount
      }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải sản phẩm đã xem',
      error: error.message
    });
  }
};

export default {
  getViewedProducts
};
