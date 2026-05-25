'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
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
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'NEW'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'COD'
      },
      paymentStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'UNPAID'
      },
      shippingAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      note: {
        type: Sequelize.TEXT
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      confirmedAt: {
        type: Sequelize.DATE
      },
      preparedAt: {
        type: Sequelize.DATE
      },
      shippedAt: {
        type: Sequelize.DATE
      },
      deliveredAt: {
        type: Sequelize.DATE
      },
      canceledAt: {
        type: Sequelize.DATE
      },
      cancelRequestedAt: {
        type: Sequelize.DATE
      },
      cancelReason: {
        type: Sequelize.TEXT
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};

