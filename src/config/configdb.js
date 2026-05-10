import { Sequelize } from 'sequelize';
//const { Sequelize } = require('sequelize');//ES5 module

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('node_fulltask', 'root', '171005', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const ensureUsersRoleColumn = async () => {
    const queryInterface = sequelize.getQueryInterface();
    const tableName = 'Users';

    const columns = await queryInterface.describeTable(tableName);
    if (!Object.prototype.hasOwnProperty.call(columns, 'role')) {
        await queryInterface.addColumn(tableName, 'role', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'user'
        });
    }
};

let connectDB = async () => {
    try {
        await sequelize.authenticate();
        await ensureUsersRoleColumn();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = connectDB;