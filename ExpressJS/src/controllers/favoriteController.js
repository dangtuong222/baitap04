'use strict';
import db from '../models/index.js';

const { Favorite, Product } = db;

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.findAll({
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
      order: [['createdAt', 'DESC']]
    });

    const data = favorites
      .filter((item) => item.product)
      .map((item) => ({
        ...item.product.toJSON(),
        favoriteId: item.id,
        favoritedAt: item.createdAt
      }));

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách yêu thích',
      error: error.message
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã sản phẩm'
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    const [favorite] = await Favorite.findOrCreate({
      where: { userId, productId }
    });

    return res.status(200).json({
      success: true,
      data: {
        productId,
        favoriteId: favorite.id
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể thêm vào yêu thích',
      error: error.message
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await Favorite.destroy({
      where: { userId, productId }
    });

    return res.status(200).json({
      success: true,
      data: {
        productId
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể xoá khỏi yêu thích',
      error: error.message
    });
  }
};

const getFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      where: { userId, productId }
    });

    return res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra yêu thích',
      error: error.message
    });
  }
};

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteStatus
};
