import db from '../models/index.js';

const { Cart, CartItem, Product } = db;

const getOrCreateCart = async (userId) => {
  const existingCart = await Cart.findOne({
    where: { userId, status: 'ACTIVE' }
  });

  if (existingCart) {
    return existingCart;
  }

  return Cart.create({ userId, status: 'ACTIVE' });
};

const loadCart = async (cartId) => {
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

const buildCartPayload = (cart) => {
  const items = (cart?.items || []).map((item) => {
    const unitPrice = item.product?.price ? parseFloat(item.product.price) : 0;
    const quantity = item.quantity || 0;
    const lineTotal = unitPrice * quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity,
      unitPrice,
      lineTotal,
      product: item.product
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart?.id || null,
    items,
    totals: {
      subtotal,
      itemCount
    }
  };
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);
    const cartData = await loadCart(cart.id);

    return res.status(200).json({
      success: true,
      data: buildCartPayload(cartData)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải giỏ hàng',
      error: error.message
    });
  }
};

const addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);

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

    const cart = await getOrCreateCart(userId);
    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    const nextQuantity = (existingItem?.quantity || 0) + parsedQuantity;
    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Số lượng tối đa cho sản phẩm này là ${product.stock}`
      });
    }

    if (existingItem) {
      await existingItem.update({ quantity: nextQuantity });
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: parsedQuantity
      });
    }

    const updatedCart = await loadCart(cart.id);
    return res.status(200).json({
      success: true,
      data: buildCartPayload(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể thêm sản phẩm vào giỏ hàng',
      error: error.message
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    const parsedQuantity = parseInt(quantity, 10);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã sản phẩm'
      });
    }

    const cart = await getOrCreateCart(userId);
    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không có trong giỏ'
      });
    }

    if (!parsedQuantity || parsedQuantity <= 0) {
      await existingItem.destroy();
      const updatedCart = await loadCart(cart.id);
      return res.status(200).json({
        success: true,
        data: buildCartPayload(updatedCart)
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Số lượng tối đa cho sản phẩm này là ${product.stock}`
      });
    }

    await existingItem.update({ quantity: parsedQuantity });
    const updatedCart = await loadCart(cart.id);

    return res.status(200).json({
      success: true,
      data: buildCartPayload(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật giỏ hàng',
      error: error.message
    });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã sản phẩm'
      });
    }

    const cart = await getOrCreateCart(userId);
    await CartItem.destroy({
      where: { cartId: cart.id, productId }
    });

    const updatedCart = await loadCart(cart.id);
    return res.status(200).json({
      success: true,
      data: buildCartPayload(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể xoá sản phẩm khỏi giỏ',
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    const updatedCart = await loadCart(cart.id);
    return res.status(200).json({
      success: true,
      data: buildCartPayload(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể xoá giỏ hàng',
      error: error.message
    });
  }
};

export default {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};
