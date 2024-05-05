const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");

route.get("/rules", (req, res) => {
    res.render("pages/guides/rules.ejs", {
        redirect: req.originalUrl,
    });
});

route.get("/donate", (req, res) => {
    res.render("pages/guides/donate.ejs", {
        redirect: req.originalUrl,
    });
});

route.get("/installation", (req, res) => {
    res.render("pages/guides/installation.ejs", {
        redirect: req.originalUrl,
    });
});
module.exports = route;
