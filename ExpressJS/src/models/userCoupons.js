'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserCoupon extends Model {
    static associate(models) {
      UserCoupon.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      UserCoupon.belongsTo(models.Coupon, {
        foreignKey: 'couponId',
        as: 'coupon'
      });
    }
  }

  UserCoupon.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Coupons',
        key: 'id'
      }
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    usedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserCoupon'
  });

  return UserCoupon;
};
