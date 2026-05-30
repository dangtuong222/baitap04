'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'subtotal', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Orders', 'promotionDiscount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Orders', 'couponCode', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Orders', 'couponDiscount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Orders', 'pointsRedeemed', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'pointsRedeemed');
    await queryInterface.removeColumn('Orders', 'couponDiscount');
    await queryInterface.removeColumn('Orders', 'couponCode');
    await queryInterface.removeColumn('Orders', 'promotionDiscount');
    await queryInterface.removeColumn('Orders', 'subtotal');
  }
};
