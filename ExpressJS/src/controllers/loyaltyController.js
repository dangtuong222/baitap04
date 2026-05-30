'use strict';
import db from '../models/index.js';
import { Op } from 'sequelize';

const { User, UserCoupon, Coupon, Product } = db;

const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const now = new Date();

    const userCoupons = await UserCoupon.findAll({
      where: { userId, isUsed: false },
      include: [
        {
          model: Coupon,
          as: 'coupon',
          where: {
            isActive: true,
            startDate: { [Op.lte]: now },
            endDate: { [Op.gte]: now }
          },
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name']
            }
          ],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const coupons = userCoupons
      .filter((item) => item.coupon)
      .map((item) => ({
        id: item.coupon.id,
        code: item.coupon.code,
        description: item.coupon.description,
        discountType: item.coupon.discountType,
        discountValue: item.coupon.discountValue,
        maxDiscount: item.coupon.maxDiscount,
        minOrderValue: item.coupon.minOrderValue,
        endDate: item.coupon.endDate,
        product: item.coupon.product ? {
          id: item.coupon.product.id,
          name: item.coupon.product.name
        } : null
      }));

    return res.status(200).json({
      success: true,
      data: {
        points: user?.loyaltyPoints || 0,
        coupons
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải kho điểm và phiếu giảm giá',
      error: error.message
    });
  }
};

export default {
  getSummary
};
