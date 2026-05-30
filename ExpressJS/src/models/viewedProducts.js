'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ViewedProduct extends Model {
    static associate(models) {
      ViewedProduct.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      ViewedProduct.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  ViewedProduct.init({
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
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ViewedProduct'
  });

  return ViewedProduct;
};
