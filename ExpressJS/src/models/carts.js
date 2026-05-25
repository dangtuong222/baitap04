'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Cart.hasMany(models.CartItem, {
        foreignKey: 'cartId',
        as: 'items'
      });
    }
  }

  Cart.init({
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
      defaultValue: 'ACTIVE'
    },
    checkedOutAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Cart'
  });

  return Cart;
};
