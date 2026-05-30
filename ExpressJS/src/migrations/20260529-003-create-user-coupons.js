'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserCoupons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      couponId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Coupons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      usedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addConstraint('UserCoupons', {
      fields: ['userId', 'couponId'],
      type: 'unique',
      name: 'uniq_user_coupon'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserCoupons');
  }
};
