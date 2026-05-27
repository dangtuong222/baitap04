import db from '../models/index.js';
import { Op } from 'sequelize';

const { Order, OrderItem, Product, Cart, CartItem, User, sequelize } = db;

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
    const quantity = item.quantity || 0;
    return {
      id: item.id,
      productId: item.productId,
      quantity,
      unitPrice,
      discount: item.discount ? parseFloat(item.discount) : 0,
      lineTotal: unitPrice * quantity,
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
    const { shippingAddress, phoneNumber, note, paymentMethod } = req.body;

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

    const subtotal = items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.product.price || 0);
      return sum + unitPrice * item.quantity;
    }, 0);

    const createdOrder = await sequelize.transaction(async (transaction) => {
      const order = await Order.create({
        userId,
        status: ORDER_STATUSES.NEW,
        paymentMethod: selectedPayment,
        paymentStatus: 'UNPAID',
        shippingAddress: resolvedAddress,
        phoneNumber: resolvedPhone,
        note,
        total: subtotal
      }, { transaction });

      for (const item of items) {
        const unitPrice = parseFloat(item.product.price || 0);
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice,
          discount: 0
        }, { transaction });

        await Product.update({
          stock: item.product.stock - item.quantity,
          sold: (item.product.sold || 0) + item.quantity
        }, {
          where: { id: item.productId },
          transaction
        });
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
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn hàng',
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
  getOrders,
  getOrderDetail,
  cancelOrder,
  updateStatus,
  autoConfirmOrders
};
