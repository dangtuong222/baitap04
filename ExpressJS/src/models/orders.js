'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items'
      });

      Order.hasMany(models.Review, {
        foreignKey: 'orderId',
        as: 'reviews'
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NEW'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'COD'
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'UNPAID'
    },
    shippingAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    promotionDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    couponCode: {
      type: DataTypes.STRING
    },
    couponDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    pointsRedeemed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    confirmedAt: {
      type: DataTypes.DATE
    },
    preparedAt: {
      type: DataTypes.DATE
    },
    shippedAt: {
      type: DataTypes.DATE
    },
    deliveredAt: {
      type: DataTypes.DATE
    },
    canceledAt: {
      type: DataTypes.DATE
    },
    cancelRequestedAt: {
      type: DataTypes.DATE
    },
    cancelReason: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Order'
  });

  return Order;
};
