require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "qwerty_6920@31",
    database: process.env.DB_NAME || "clearsync",
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

module.exports = pool;
