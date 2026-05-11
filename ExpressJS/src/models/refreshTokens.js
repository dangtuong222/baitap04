'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // định nghĩa mối quan hệ
    }
  }
  RefreshToken.init({
    token: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    expiresAt: DataTypes.DATE,
    revoked: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'RefreshToken',
  });
  return RefreshToken;
};