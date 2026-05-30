'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Review.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      Review.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Review.belongsTo(models.Coupon, {
        foreignKey: 'rewardCouponId',
        as: 'rewardCoupon'
      });
    }
  }

  Review.init({
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: DataTypes.TEXT,
    rewardType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'POINTS'
    },
    rewardValue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    rewardCouponId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Coupons',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Review'
  });

  return Review;
};
