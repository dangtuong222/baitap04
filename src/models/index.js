'use strict';

import { Sequelize } from 'sequelize';
import configJson from '../config/config.json';
import UserModel from './user';

const env = process.env.NODE_ENV || 'development';
const config = configJson[env];

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: config.dialect,
        logging: false
    }
);

const db = {};
db.User = UserModel(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;