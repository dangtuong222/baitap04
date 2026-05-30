import db from '../models/index.js';
import { Op } from 'sequelize';

const { Order, OrderItem, Product, Cart, CartItem, User, Promotion, Coupon, UserCoupon, sequelize } = db;

const ORDER_STATUSES = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED',
  CANCEL_REQUESTED: 'CANCEL_REQUESTED'
};

const PAYMENT_METHODS = {
  COD: 'COD'
};

const AUTO_CONFIRM_MINUTES = 30;
const CANCEL_WINDOW_MINUTES = 30;

const REVIEW_POINT_UNIT = 1;

const normalizeNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const roundCurrency = (value) => Math.round((normalizeNumber(value) + Number.EPSILON) * 100) / 100;

const groupPromotions = (promotions) => {
  return promotions.reduce((acc, promo) => {
    if (!acc[promo.productId]) {
      acc[promo.productId] = [];
    }
    acc[promo.productId].push(promo);
    return acc;
  }, {});
};

const resolvePromotionDiscount = (unitPrice, promotions) => {
  if (!promotions || promotions.length === 0) {
    return 0;
  }

  const price = normalizeNumber(unitPrice);
  const bestDiscount = promotions.reduce((maxDiscount, promo) => {
    const percentDiscount = promo.discountPercent ? price * (promo.discountPercent / 100) : 0;
    const fixedDiscount = promo.discountPrice ? normalizeNumber(promo.discountPrice) : 0;
    return Math.max(maxDiscount, percentDiscount, fixedDiscount);
  }, 0);

  return Math.min(bestDiscount, price);
};

const resolveCoupon = async (code, userId, transaction) => {
  if (!code) {
    return { coupon: null, userCoupon: null };
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { coupon: null, userCoupon: null };
  }

  const coupon = await Coupon.findOne({
    where: { code: normalizedCode },
    transaction
  });

  if (!coupon) {
    return { error: 'Mã giảm giá không tồn tại' };
  }

  const now = new Date();
  if (!coupon.isActive || coupon.startDate > now || coupon.endDate < now) {
    return { error: 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực' };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { error: 'Mã giảm giá đã hết lượt sử dụng' };
  }

  let userCoupon = null;
  if (!coupon.isPublic) {
    userCoupon = await UserCoupon.findOne({
      where: { userId, couponId: coupon.id, isUsed: false },
      transaction
    });
    if (!userCoupon) {
      return { error: 'Mã giảm giá không khả dụng cho tài khoản này' };
    }
  }

  return { coupon, userCoupon };
};

const buildOrderSummary = async ({ items, user, couponCode, points, transaction }) => {
  const now = new Date();
  const productIds = items.map((item) => item.productId);
  const promotions = await Promotion.findAll({
    where: {
      productId: { [Op.in]: productIds },
      isActive: true,
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now }
    },
    transaction
  });

  const promotionsByProduct = groupPromotions(promotions);
  const enrichedItems = items.map((item) => {
    const unitPrice = normalizeNumber(item.product?.price);
    const promotionDiscountPerUnit = resolvePromotionDiscount(unitPrice, promotionsByProduct[item.productId]);
    const quantity = item.quantity || 0;
    const lineSubtotal = unitPrice * quantity;
    const linePromotionDiscount = promotionDiscountPerUnit * quantity;
    const lineTotal = lineSubtotal - linePromotionDiscount;

    return {
      productId: item.productId,
      quantity,
      unitPrice,
      promotionDiscountPerUnit,
      lineSubtotal,
      linePromotionDiscount,
      lineTotal,
      product: item.product
    };
  });

  const subtotal = roundCurrency(enrichedItems.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const promotionDiscount = roundCurrency(enrichedItems.reduce((sum, item) => sum + item.linePromotionDiscount, 0));
  const discountedSubtotal = roundCurrency(subtotal - promotionDiscount);

  const { coupon, userCoupon, error } = await resolveCoupon(couponCode, user.id, transaction);
  if (error) {
    return { success: false, message: error };
  }

  let couponDiscount = 0;
  if (coupon) {
    const eligibleAmount = enrichedItems
      .filter((item) => !coupon.productId || item.productId === coupon.productId)
      .reduce((sum, item) => sum + item.lineTotal, 0);

    if (eligibleAmount <= 0) {
      return { success: false, message: 'Mã giảm giá không áp dụng cho sản phẩm trong giỏ' };
    }

    if (coupon.minOrderValue && eligibleAmount < normalizeNumber(coupon.minOrderValue)) {
      return { success: false, message: 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá' };
    }

    if (coupon.discountType === 'PERCENT') {
      couponDiscount = eligibleAmount * (normalizeNumber(coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        couponDiscount = Math.min(couponDiscount, normalizeNumber(coupon.maxDiscount));
      }
    } else {
      couponDiscount = normalizeNumber(coupon.discountValue);
    }

    couponDiscount = roundCurrency(Math.min(couponDiscount, eligibleAmount));
  }

  const totalAfterCoupon = roundCurrency(discountedSubtotal - couponDiscount);
  const availablePoints = Math.max(0, user.loyaltyPoints || 0);
  const requestedPoints = Math.max(0, parseInt(points, 10) || 0);
  const pointsRedeemed = Math.min(requestedPoints, availablePoints, Math.floor(totalAfterCoupon / REVIEW_POINT_UNIT));
  const total = roundCurrency(totalAfterCoupon - pointsRedeemed * REVIEW_POINT_UNIT);

  return {
    success: true,
    items: enrichedItems,
    subtotal,
    promotionDiscount,
    coupon,
    userCoupon,
    couponDiscount,
    pointsRedeemed,
    total,
    availablePoints
  };
};

const getOrCreateCart = async (userId) => {
  const existingCart = await Cart.findOne({
    where: { userId, status: 'ACTIVE' }
  });

  if (existingCart) {
    return existingCart;
  }

  return Cart.create({ userId, status: 'ACTIVE' });
};

const loadCartItems = async (cartId) => {
  return Cart.findByPk(cartId, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                association: 'images',
                attributes: ['imageUrl', 'alt', 'displayOrder']
              }
            ]
          }
        ]
      }
    ],
    order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']]
  });
};

const loadOrder = async (orderId, userId) => {
  const where = userId ? { id: orderId, userId } : { id: orderId };
  return Order.findOne({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                association: 'images',
                attributes: ['imageUrl', 'alt', 'displayOrder']
              }
            ]
          }
        ]
      }
    ],
    order: [[{ model: OrderItem, as: 'items' }, 'createdAt', 'ASC']]
  });
};

const buildOrderPayload = (order) => {
  if (!order) {
    return null;
  }

  const items = (order.items || []).map((item) => {
    const unitPrice = item.price ? parseFloat(item.price) : 0;
    const unitDiscount = item.discount ? parseFloat(item.discount) : 0;
    const quantity = item.quantity || 0;
    const lineTotal = unitPrice * quantity;
    const discountTotal = unitDiscount * quantity;
    const finalLineTotal = lineTotal - discountTotal;
    return {
      id: item.id,
      productId: item.productId,
      quantity,
      unitPrice,
      unitDiscount,
      lineTotal,
      discountTotal,
      finalLineTotal,
      product: item.product
    };
  });

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    phoneNumber: order.phoneNumber,
    note: order.note,
    total: order.total ? parseFloat(order.total) : 0,
    subtotal: order.subtotal ? parseFloat(order.subtotal) : (order.total ? parseFloat(order.total) : 0),
    promotionDiscount: order.promotionDiscount ? parseFloat(order.promotionDiscount) : 0,
    couponCode: order.couponCode || null,
    couponDiscount: order.couponDiscount ? parseFloat(order.couponDiscount) : 0,
    pointsRedeemed: order.pointsRedeemed || 0,
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
    preparedAt: order.preparedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    canceledAt: order.canceledAt,
    cancelRequestedAt: order.cancelRequestedAt,
    cancelReason: order.cancelReason,
    user: order.user ? {
      id: order.user.id,
      email: order.user.email,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      phoneNumber: order.user.phoneNumber
    } : null,
    items
  };
};

const previewOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode, points } = req.query;
    const user = await User.findByPk(userId);
    const cart = await getOrCreateCart(userId);
    const cartData = await loadCartItems(cart.id);
    const items = cartData?.items || [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống'
      });
    }

    const summary = await buildOrderSummary({ items, user, couponCode, points });
    if (!summary.success) {
      return res.status(400).json({
        success: false,
        message: summary.message
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        items: summary.items,
        subtotal: summary.subtotal,
        promotionDiscount: summary.promotionDiscount,
        couponCode: summary.coupon?.code || null,
        couponDiscount: summary.couponDiscount,
        pointsRedeemed: summary.pointsRedeemed,
        total: summary.total,
        availablePoints: summary.availablePoints
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tính toán đơn hàng',
      error: error.message
    });
  }
};

const autoConfirmOrders = async (userId) => {
  const threshold = new Date(Date.now() - AUTO_CONFIRM_MINUTES * 60 * 1000);
  const where = {
    status: ORDER_STATUSES.NEW,
    createdAt: { [Op.lte]: threshold }
  };
  if (userId) {
    where.userId = userId;
  }

  await Order.update(
    {
      status: ORDER_STATUSES.CONFIRMED,
      confirmedAt: new Date()
    },
    { where }
  );
};

const applyStatusTimestamp = (status, paymentMethod) => {
  const now = new Date();
  switch (status) {
    case ORDER_STATUSES.CONFIRMED:
      return { confirmedAt: now };
    case ORDER_STATUSES.PREPARING:
      return { preparedAt: now };
    case ORDER_STATUSES.SHIPPING:
      return { shippedAt: now };
    case ORDER_STATUSES.DELIVERED:
      return {
        deliveredAt: now,
        paymentStatus: paymentMethod === PAYMENT_METHODS.COD ? 'PAID' : 'UNPAID'
      };
    case ORDER_STATUSES.CANCELED:
      return { canceledAt: now };
    case ORDER_STATUSES.CANCEL_REQUESTED:
      return { cancelRequestedAt: now };
    default:
      return {};
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, phoneNumber, note, paymentMethod, couponCode, points } = req.body;

    const user = await User.findByPk(userId);
    const resolvedAddress = shippingAddress || user?.address;
    const resolvedPhone = phoneNumber || user?.phoneNumber;

    if (!resolvedAddress || !resolvedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ và số điện thoại nhận hàng'
      });
    }

    const selectedPayment = paymentMethod || PAYMENT_METHODS.COD;
    if (selectedPayment !== PAYMENT_METHODS.COD) {
      return res.status(400).json({
        success: false,
        message: 'Hiện chỉ hỗ trợ thanh toán COD'
      });
    }

    const cart = await getOrCreateCart(userId);
    const cartData = await loadCartItems(cart.id);
    const items = cartData?.items || [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống'
      });
    }

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: 'Một số sản phẩm trong giỏ hàng không còn tồn tại'
        });
      }
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.product.name} chỉ còn ${item.product.stock} sản phẩm`
        });
      }
    }

    const createdOrder = await sequelize.transaction(async (transaction) => {
      const transactionUser = await User.findByPk(userId, { transaction });
      const summary = await buildOrderSummary({
        items,
        user: transactionUser,
        couponCode,
        points,
        transaction
      });

      if (!summary.success) {
        throw new Error(summary.message);
      }

      const order = await Order.create({
        userId,
        status: ORDER_STATUSES.NEW,
        paymentMethod: selectedPayment,
        paymentStatus: 'UNPAID',
        shippingAddress: resolvedAddress,
        phoneNumber: resolvedPhone,
        note,
        total: summary.total,
        subtotal: summary.subtotal,
        promotionDiscount: summary.promotionDiscount,
        couponCode: summary.coupon?.code || null,
        couponDiscount: summary.couponDiscount,
        pointsRedeemed: summary.pointsRedeemed
      }, { transaction });

      for (const item of summary.items) {
        const unitPrice = item.unitPrice;
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice,
          discount: item.promotionDiscountPerUnit
        }, { transaction });

        await Product.update({
          stock: item.product.stock - item.quantity,
          sold: (item.product.sold || 0) + item.quantity
        }, {
          where: { id: item.productId },
          transaction
        });
      }

      if (summary.coupon) {
        await Coupon.update({
          usageCount: (summary.coupon.usageCount || 0) + 1
        }, {
          where: { id: summary.coupon.id },
          transaction
        });

        if (summary.userCoupon) {
          await summary.userCoupon.update({
            isUsed: true,
            usedAt: new Date()
          }, { transaction });
        } else if (summary.coupon.isPublic) {
          const [userCoupon] = await UserCoupon.findOrCreate({
            where: { userId, couponId: summary.coupon.id },
            defaults: { isUsed: true, usedAt: new Date() },
            transaction
          });

          if (!userCoupon.isUsed) {
            await userCoupon.update({ isUsed: true, usedAt: new Date() }, { transaction });
          }
        }
      }

      if (summary.pointsRedeemed > 0) {
        await transactionUser.update({
          loyaltyPoints: Math.max(0, (transactionUser.loyaltyPoints || 0) - summary.pointsRedeemed)
        }, { transaction });
      }

      await CartItem.destroy({
        where: { cartId: cart.id },
        transaction
      });

      return order;
    });

    const orderData = await loadOrder(createdOrder.id, userId);
    return res.status(201).json({
      success: true,
      data: buildOrderPayload(orderData)
    });
  } catch (error) {
    const message = error?.message || 'Không thể tạo đơn hàng';
    const status = message.includes('Mã giảm giá') || message.includes('Đơn hàng') ? 400 : 500;
    return res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    await autoConfirmOrders(isAdmin ? undefined : userId);

    const where = isAdmin ? {} : { userId };

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: orders.map(buildOrderPayload)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách đơn hàng',
      error: error.message
    });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    await autoConfirmOrders(isAdmin ? undefined : userId);

    const order = await loadOrder(id, isAdmin ? undefined : userId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    return res.status(200).json({
      success: true,
      data: buildOrderPayload(order)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải đơn hàng',
      error: error.message
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body || {};

    await autoConfirmOrders(userId);
    const order = await loadOrder(id, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.status === ORDER_STATUSES.CANCEL_REQUESTED) {
      return res.status(200).json({
        success: true,
        data: buildOrderPayload(order)
      });
    }

    const orderAgeMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000);

    if (['NEW', 'CONFIRMED'].includes(order.status)) {
      await sequelize.transaction(async (transaction) => {
        await order.update({
          status: ORDER_STATUSES.CANCELED,
          cancelReason: reason || order.cancelReason,
          ...applyStatusTimestamp(ORDER_STATUSES.CANCELED)
        }, { transaction });

        for (const item of order.items || []) {
          if (!item.product) {
            continue;
          }
          await Product.update({
            stock: item.product.stock + item.quantity,
            sold: Math.max((item.product.sold || 0) - item.quantity, 0)
          }, {
            where: { id: item.productId },
            transaction
          });
        }
      });

      const updatedOrder = await loadOrder(order.id, userId);
      return res.status(200).json({
        success: true,
        data: buildOrderPayload(updatedOrder)
      });
    }

    if (order.status === ORDER_STATUSES.PREPARING) {
      if (orderAgeMinutes > CANCEL_WINDOW_MINUTES) {
        return res.status(400).json({
          success: false,
          message: 'Bạn chỉ có thể gửi yêu cầu hủy đơn trong 30 phút đầu sau khi đặt hàng'
        });
      }

      await order.update({
        status: ORDER_STATUSES.CANCEL_REQUESTED,
        cancelReason: reason || order.cancelReason,
        ...applyStatusTimestamp(ORDER_STATUSES.CANCEL_REQUESTED)
      });

      const updatedOrder = await loadOrder(order.id, userId);
      return res.status(200).json({
        success: true,
        data: buildOrderPayload(updatedOrder)
      });
    }

    if (['SHIPPING', 'DELIVERED', 'CANCELED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã sang giai đoạn giao hoặc hoàn tất nên không thể hủy'
      });
    }

    if (order.status !== ORDER_STATUSES.PREPARING) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không thể hủy ở trạng thái hiện tại'
      });
    }

    if (orderAgeMinutes > CANCEL_WINDOW_MINUTES) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể gửi yêu cầu hủy đơn trong 30 phút đầu sau khi đặt hàng'
      });
    }

    await order.update({
      status: ORDER_STATUSES.CANCEL_REQUESTED,
      cancelReason: reason || order.cancelReason,
      ...applyStatusTimestamp(ORDER_STATUSES.CANCEL_REQUESTED)
    });

    const updatedOrder = await loadOrder(order.id, userId);
    return res.status(200).json({
      success: true,
      data: buildOrderPayload(updatedOrder)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể hủy đơn hàng',
      error: error.message
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(ORDER_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const order = await loadOrder(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const allowedTransitions = {
      [ORDER_STATUSES.NEW]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELED],
      [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELED],
      [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.SHIPPING, ORDER_STATUSES.CANCEL_REQUESTED],
      [ORDER_STATUSES.SHIPPING]: [ORDER_STATUSES.DELIVERED],
      [ORDER_STATUSES.CANCEL_REQUESTED]: [ORDER_STATUSES.CANCELED, ORDER_STATUSES.PREPARING]
    };

    const currentAllowed = allowedTransitions[order.status] || [];
    if (!currentAllowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển trạng thái đơn hàng'
      });
    }

    if (status === ORDER_STATUSES.CANCELED) {
      await sequelize.transaction(async (transaction) => {
        await order.update({
          status,
          ...applyStatusTimestamp(status, order.paymentMethod)
        }, { transaction });

        for (const item of order.items || []) {
          if (!item.product) {
            continue;
          }
          await Product.update({
            stock: item.product.stock + item.quantity,
            sold: Math.max((item.product.sold || 0) - item.quantity, 0)
          }, {
            where: { id: item.productId },
            transaction
          });
        }
      });
    } else {
      await order.update({
        status,
        ...applyStatusTimestamp(status, order.paymentMethod)
      });
    }

    const updatedOrder = await loadOrder(order.id);
    return res.status(200).json({
      success: true,
      data: buildOrderPayload(updatedOrder)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

export default {
  createOrder,
  previewOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  updateStatus,
  autoConfirmOrders
};
