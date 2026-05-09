'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ResetOtp extends Model {
    static associate(models) {
      // Optional: association to User by email if needed later
    }
  }

  ResetOtp.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ResetOtp',
    tableName: 'ResetOtps'
  });

  return ResetOtp;
};
