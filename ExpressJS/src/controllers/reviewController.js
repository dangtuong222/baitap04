'use strict';
import db from '../models/index.js';

const { Review, User, Order, OrderItem, Product, Coupon, UserCoupon, sequelize } = db;

const REVIEW_POINTS_REWARD = 50;
const REVIEW_COUPON_PERCENT = 10;
const REVIEW_COUPON_MAX_DISCOUNT = 50;
const REVIEW_COUPON_VALID_DAYS = 30;

const generateCouponCode = () => {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REVIEW-${stamp}-${random}`;
};

const loadDeliveredOrdersWithProduct = async (userId, productId) => {
  return Order.findAll({
    where: {
      userId,
      status: 'DELIVERED'
    },
    include: [
      {
        model: OrderItem,
        as: 'items',
        where: { productId }
      }
    ],
    order: [['deliveredAt', 'DESC']]
  });
};

const getReviewEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const productId = parseInt(id, 10);

    const deliveredOrders = await loadDeliveredOrdersWithProduct(userId, productId);
    const reviewedOrders = await Review.findAll({
      where: { userId, productId },
      attributes: ['orderId'],
      raw: true
    });
    const reviewedIds = new Set(reviewedOrders.map((item) => item.orderId));
    const eligibleOrder = deliveredOrders.find((order) => !reviewedIds.has(order.id));

    return res.status(200).json({
      success: true,
      data: {
        canReview: !!eligibleOrder,
        eligibleOrderId: eligibleOrder?.id || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra điều kiện đánh giá',
      error: error.message
    });
  }
};

const getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    const data = rows.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      rewardType: review.rewardType,
      rewardValue: review.rewardValue,
      user: review.user ? {
        id: review.user.id,
        name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || review.user.email
      } : null
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
      message: 'Không thể tải đánh giá',
      error: error.message
    });
  }
};

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const productId = parseInt(id, 10);
    const { rating, comment, rewardType, orderId } = req.body || {};

    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn mức đánh giá từ 1 đến 5'
      });
    }

    const deliveredOrders = await loadDeliveredOrdersWithProduct(userId, productId);
    if (!deliveredOrders.length) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần mua và nhận hàng thành công trước khi đánh giá'
      });
    }

    const reviewedOrders = await Review.findAll({
      where: { userId, productId },
      attributes: ['orderId'],
      raw: true
    });
    const reviewedIds = new Set(reviewedOrders.map((item) => item.orderId));

    let targetOrder = null;
    if (orderId) {
      targetOrder = deliveredOrders.find((order) => order.id === orderId);
      if (!targetOrder || reviewedIds.has(targetOrder.id)) {
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng này đã được đánh giá hoặc không hợp lệ'
        });
      }
    } else {
      targetOrder = deliveredOrders.find((order) => !reviewedIds.has(order.id));
    }

    if (!targetOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá tất cả đơn hàng chứa sản phẩm này'
      });
    }

    const selectedReward = rewardType === 'COUPON' ? 'COUPON' : 'POINTS';
    let rewardPayload = null;

    const createdReview = await sequelize.transaction(async (transaction) => {
      let rewardCoupon = null;
      let rewardValue = 0;

      if (selectedReward === 'COUPON') {
        const code = generateCouponCode();
        rewardCoupon = await Coupon.create({
          code,
          description: 'Mã giảm giá dành cho đánh giá sản phẩm',
          discountType: 'PERCENT',
          discountValue: REVIEW_COUPON_PERCENT,
          maxDiscount: REVIEW_COUPON_MAX_DISCOUNT,
          minOrderValue: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + REVIEW_COUPON_VALID_DAYS * 24 * 60 * 60 * 1000),
          isActive: true,
          usageLimit: 1,
          usageCount: 0,
          isPublic: false
        }, { transaction });

        await UserCoupon.create({
          userId,
          couponId: rewardCoupon.id
        }, { transaction });

        rewardValue = REVIEW_COUPON_PERCENT;
        rewardPayload = {
          type: 'COUPON',
          code,
          discountPercent: REVIEW_COUPON_PERCENT,
          maxDiscount: REVIEW_COUPON_MAX_DISCOUNT,
          validUntil: rewardCoupon.endDate
        };
      } else {
        rewardValue = REVIEW_POINTS_REWARD;
        const user = await User.findByPk(userId, { transaction });
        await user.update({
          loyaltyPoints: (user.loyaltyPoints || 0) + REVIEW_POINTS_REWARD
        }, { transaction });

        rewardPayload = {
          type: 'POINTS',
          points: REVIEW_POINTS_REWARD
        };
      }

      const review = await Review.create({
        userId,
        productId,
        orderId: targetOrder.id,
        rating: parsedRating,
        comment,
        rewardType: selectedReward,
        rewardValue,
        rewardCouponId: rewardCoupon?.id || null
      }, { transaction });

      const stats = await Review.findAll({
        where: { productId },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating']
        ],
        raw: true,
        transaction
      });
      const avgRating = parseFloat(stats[0]?.avgRating || 0);
      await Product.update({ rating: avgRating }, { where: { id: productId }, transaction });

      return review;
    });

    const reviewWithUser = await Review.findByPk(createdReview.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: {
        id: reviewWithUser.id,
        rating: reviewWithUser.rating,
        comment: reviewWithUser.comment,
        createdAt: reviewWithUser.createdAt,
        rewardType: reviewWithUser.rewardType,
        rewardValue: reviewWithUser.rewardValue,
        user: reviewWithUser.user ? {
          id: reviewWithUser.user.id,
          name: `${reviewWithUser.user.firstName || ''} ${reviewWithUser.user.lastName || ''}`.trim() || reviewWithUser.user.email
        } : null,
        reward: rewardPayload
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi đánh giá',
      error: error.message
    });
  }
};

export default {
  getReviews,
  createReview,
  getReviewEligibility
};
