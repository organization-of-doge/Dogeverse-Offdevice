const express = require("express");
const route = express.Router();
const moment = require("moment");

const common_querys = require("../../utils/common_querys");

route.use(async (req, res, next) => {
    if (res.locals.guest_mode) {
        return next();
    }

    res.locals.user_stats = await common_querys
        .get_user_stats(res.locals.user.id)
        .clone();

    return next();
});

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
