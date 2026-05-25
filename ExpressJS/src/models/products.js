'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
      
      Product.hasMany(models.ProductImage, {
        foreignKey: 'productId',
        as: 'images'
      });

      Product.hasMany(models.Promotion, {
        foreignKey: 'productId',
        as: 'promotions'
      });

      Product.hasMany(models.CartItem, {
        foreignKey: 'productId',
        as: 'cartItems'
      });

      Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems'
      });
    }
  }

  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    sold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    isBestseller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Product'
  });

  return Product;
};
