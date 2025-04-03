const config = require('dotenv').config();

config({path: '/config/.env'});

module.exports = { PORT:process.env.PORT }