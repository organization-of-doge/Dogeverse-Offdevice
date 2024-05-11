const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");

route.use(async (req, res, next) => {
    if (res.locals.guest_mode) {
        return next();
    }

    res.locals.user_stats = await db_con
        .env_db("account.accounts")
        .select(
            db_con.env_db.raw(
                "(SELECT COUNT(*) FROM posts WHERE posts.account_id = accounts.id) as post_count"
            ),
            db_con.env_db.raw(
                "(SELECT COUNT(*) FROM empathies WHERE empathies.account_id = accounts.id) as empathy_count"
            )
        )
        .where({
            "accounts.id": res.locals.user.id,
        })
        .first();

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
