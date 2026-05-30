'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    static associate(models) {
      Coupon.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      Coupon.hasMany(models.UserCoupon, {
        foreignKey: 'couponId',
        as: 'userCoupons'
      });

      Coupon.hasMany(models.Review, {
        foreignKey: 'rewardCouponId',
        as: 'reviewRewards'
      });
    }
  }

  Coupon.init({
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    discountType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PERCENT'
    },
    discountValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    maxDiscount: DataTypes.DECIMAL(12, 2),
    minOrderValue: DataTypes.DECIMAL(12, 2),
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usageLimit: DataTypes.INTEGER,
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Products',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Coupon'
  });

  return Coupon;
};
