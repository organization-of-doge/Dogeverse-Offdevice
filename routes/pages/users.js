const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");

route.get("/:nnid", async (req, res) => {
    const user = (
        await db_con.account_db("accounts").where({ nnid: req.params.nnid })
    )[0];

    const user_posts = await db_con
        .env_db("posts")
        .select(
            "posts.*",
            "accounts.mii_name",
            "accounts.nnid",
            "accounts.mii_hash",
            "accounts.admin",
            "communities.name as community_name",
            "communities.cdn_icon_url",
            "communities.id as community_id",
            db_con.env_db.raw("COUNT(empathies.post_id) as empathy_count")
        )
        .where({ "posts.account_id": user.id })
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .innerJoin("communities", "communities.id", "=", "posts.community_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id")
        .orderBy("posts.create_time", "desc");

    const user_favorites = await db_con
        .env_db("favorites")
        .select(
            "communities.name as community_name",
            "communities.cdn_icon_url",
            "communities.id as community_id"
        )
        .where({ "favorites.account_id": user.id })
        .innerJoin(
            "communities",
            "communities.id",
            "=",
            "favorites.community_id"
        );

    res.render("pages/users/user.ejs", {
        view_user: user,
        view_user_favorites: user_favorites,
        view_user_posts: user_posts,
    });
});

module.exports = route;
