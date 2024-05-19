const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");
const ejs = require("ejs");

const common_querys = require("../../utils/common_querys");

route.get("/:community_id", async (req, res) => {
    const community_id = req.params.community_id;
    const offset = parseInt(req.query["offset"]) || 0;
    const limit = parseInt(req.query["limit"]) || 25;
    const raw_html = req.query["raw"];

    const community_data_query = db_con
        .env_db("communities")
        .select("communities.*")
        .where({ "communities.id": community_id });

    if (!res.locals.guest_mode) {
        community_data_query.select(
            db_con.env_db.raw(
                `
            EXISTS (
                SELECT 1
                FROM favorites
                WHERE favorites.account_id=?
                AND favorites.community_id=communities.id
            ) AS is_favorited
        `,
                [res.locals.user.id]
            )
        );
    }

    const community_data = await community_data_query.first();

    const base_posts_query = db_con
        .env_db("posts")
        .select(
            "posts.*",
            "accounts.mii_name",
            "accounts.cdn_profile_normal_image_url",
            "accounts.cdn_profile_happy_image_url",
            "accounts.cdn_profile_like_image_url",
            "accounts.cdn_profile_surprised_image_url",
            "accounts.cdn_profile_frustrated_image_url",
            "accounts.cdn_profile_puzzled_image_url",
            "accounts.id as account_id",
            "accounts.username",
            "accounts.nnid",
            "accounts.admin",
            db_con.env_db.raw("COUNT(empathies.post_id) as empathy_count")
        )
        .where({ "posts.community_id": community_id })
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id");

    var popular_posts, ingame_posts, recent_drawings, normal_posts;

    if (res.locals.guest_mode) {
        popular_posts = await base_posts_query
            .clone()
            .orderBy("empathy_count", "desc")
            .limit(5);

        ingame_posts = await base_posts_query
            .clone()
            .whereNotNull("posts.app_data")
            .orderBy("posts.create_time", "desc")
            .limit(5);

        recent_drawings = await base_posts_query
            .clone()
            .whereNotNull("posts.painting_cdn_url")
            .orderBy("posts.create_time", "desc")
            .limit(5);
    } else {
        normal_posts = await base_posts_query
            .select(
                db_con.env_db.raw(
                    `EXISTS ( 
                    SELECT 1
                    FROM empathies
                    WHERE empathies.account_id=?
                    AND empathies.post_id=posts.id
                ) AS empathied_by_user
            `,
                    [res.locals.user.id]
                )
            )
            .orderBy("posts.create_time", "desc")
            .limit(limit)
            .offset(offset);

        if (raw_html) {
            if (normal_posts.length <= 0) {
                res.sendStatus(204);
                return;
            }

            var html = "",
                show_community,
                last_community_id;

            for (const post of normal_posts) {
                if (post.community_id === last_community_id) {
                    show_community = true;
                } else {
                    show_community = false;
                }

                html += await ejs.renderFile(
                    __dirname + "/../../views/partials/elements/ugc/posts.ejs",
                    {
                        post: post,
                        locals: res.locals,
                        show_community: show_community,
                    }
                );
            }

            res.status(200).send(html);
            return;
        }
    }

    res.render("pages/community.ejs", {
        community: community_data,

        recent_drawings: recent_drawings,
        popular_posts: popular_posts,
        ingame_posts: ingame_posts,
        normal_posts: normal_posts,
    });
});

module.exports = route;
