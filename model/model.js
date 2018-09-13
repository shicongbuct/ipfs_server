var Sequelize = require('sequelize');
var config = require('../config/index');

const APP = "ipfs";
const psqlHost = config.psqlHost;
var sequelize = new Sequelize(APP, APP, `${APP}`, {
    host: psqlHost,
    logging: false,
    define: {
        freezeTableName: true,
        underscored: true
    },
    pool: {
        max: 400,
        min: 0,
        acquire: 30000,
        idle: 2000
    },
    dialect: 'postgres',
    timezone: '+08:00' //东八时区
});

exports.sequelize = sequelize;
exports.Sequelize = Sequelize;