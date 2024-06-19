const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../utils/database_con");
const common_querys = require("../../utils/common_querys");

route.get("/:post_id", async (req, res) => {
    //Getting post data
    var post = common_querys.posts_query
        .clone()
        .where({ "posts.id": req.params.post_id })
        .limit(1)
        .first();

    if (!res.locals.guest_mode) {
        post.select(common_querys.is_yeahed(res.locals.user.id));
    }

    post = await post;

    //Getting all empathies for the post
    const empathies = await db_con
        .env_db("empathies")
        .select("empathies.*", "accounts.username")
        .select(common_querys.account_profile_images)
        .where({ post_id: req.params.post_id })
        .innerJoin("account.accounts", "accounts.id", "=", "empathies.account_id")
        .orderBy("empathies.create_time", "desc");

    var replies = db_con.env_db("replies")
        .select("replies.*", "accounts.username", "accounts.mii_name")
        .select(common_querys.account_profile_images)
        .select(db_con.env_db.raw(
            "(SELECT COUNT(empathies.reply_id) FROM empathies WHERE empathies.reply_id=replies.id) as empathy_count"
        ))
        .where({ post_id: req.params.post_id })
        .innerJoin("account.accounts", "accounts.id", "=", "replies.account_id")

    if (!res.locals.guest_mode) {
        replies.select(common_querys.is_reply_yeahed(res.locals.user.id))
    }

    replies = await replies;

    res.render("pages/post.ejs", {
        post: post,
        empathies: empathies,
        replies: replies
    });
});

module.exports = route;
