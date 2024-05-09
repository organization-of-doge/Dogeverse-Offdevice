const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");

route.get("/:nnid", async (req, res) => {
    const user = (
        await db_con.account_db("accounts").where({ nnid: req.params.nnid })
    )[0];

    var user_posts = db_con
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
        .orderBy("posts.create_time", "desc")
        .limit(5);

    const user_stats = await db_con
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
            "accounts.id": user.id,
        })
        .first();

    console.log(user_stats);

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

    if (!res.locals.guest_mode) {
        user_posts.select(
            db_con.env_db.raw(
                `CASE WHEN empathies.account_id = ${res.locals.user.id} THEN TRUE ELSE FALSE END AS empathied_by_user`
            )
        );
    }

    user_posts = await user_posts;

    res.render("pages/users/user.ejs", {
        view_user: user,
        view_user_favorites: user_favorites,
        view_user_posts: user_posts,
        view_user_stats: user_stats,
    });
});

module.exports = route;
