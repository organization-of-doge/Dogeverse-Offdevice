const express = require('express');
const route = express.Router();
const moment = require('moment');

const db_con = require("../../../shared_config/database_con")

route.get("/:community_id", async (req, res) => {
    const community_id = req.params.community_id
    const community_data = (await db_con.env_db("communities").where({ id: community_id }))[0];

    const base_posts_query = db_con.env_db("posts")
        .select("posts.*",
            "accounts.mii_name",
            "accounts.mii_hash",
            "accounts.id as account_id",
            "accounts.nnid",
            "accounts.admin",
            db_con.env_db.raw("COUNT(empathies.post_id) as empathy_count"))
        .where({ "posts.community_id": community_id })
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id")

    var popular_posts, ingame_posts, recent_drawings, normal_posts;

    if (res.locals.guest_mode) {
        popular_posts = await base_posts_query.orderBy("empathy_count", "desc").limit(5)

        ingame_posts = await base_posts_query.whereNotNull("posts.app_data").orderBy("posts.create_time", "desc").limit(5)

        recent_drawings = await base_posts_query.whereNotNull("posts.painting_cdn_url").orderBy("posts.create_time", "desc").limit(5)
    } else {
        normal_posts = await base_posts_query
            .select(db_con.env_db.raw(`CASE WHEN empathies.account_id = ${res.locals.user.id} THEN TRUE ELSE FALSE END AS empathied_by_user`))
            .orderBy("posts.create_time", "desc")
            .limit(15)
    }

    res.render("pages/community.ejs", {
        community: community_data,

        recent_drawings: recent_drawings,
        popular_posts: popular_posts,
        ingame_posts: ingame_posts,
        normal_posts: normal_posts
    })
})

module.exports = route