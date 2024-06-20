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

    var replies = common_querys.replies_query.clone()
        .select(common_querys.account_profile_images)
        .where({ "replies.post_id": req.params.post_id })
        .orderBy("replies.create_time", "desc")

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
