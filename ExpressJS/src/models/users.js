'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Cart, {
        foreignKey: 'userId',
        as: 'carts'
      });

      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });

      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviews'
      });

      User.hasMany(models.Favorite, {
        foreignKey: 'userId',
        as: 'favorites'
      });

      User.hasMany(models.ViewedProduct, {
        foreignKey: 'userId',
        as: 'viewedProducts'
      });

      User.hasMany(models.UserCoupon, {
        foreignKey: 'userId',
        as: 'userCoupons'
      });
    }
  }
  User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    refreshToken: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    address: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    gender: DataTypes.BOOLEAN,
    image: DataTypes.STRING,
    positionId: DataTypes.STRING,
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
