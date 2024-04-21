const express = require('express');
const route = express.Router();
const moment = require('moment');

const db_con = require("../../../shared_config/database_con")

route.get("/", (req, res) => {
    res.render("pages/index.ejs")
})

module.exports = route