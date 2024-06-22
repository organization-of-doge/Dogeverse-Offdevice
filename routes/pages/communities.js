const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../utils/database_con");
const ejs = require("ejs");

const common_querys = require("../../utils/common_querys");
const generate_partial = require("../utils/generate_partial")

route.get("/categories/:category", async (req, res) => {
    switch (req.params.category) {
        case "3ds":
        case "wiiu":
        case "vc":
            var category = req.params.category
            break;

        default:
            res.render("pages/errors/common/404.ejs");
            return; break;
    }

    const limit = req.query["limit"] || 30
    const offset = req.query["offset"] || 0
    const raw = req.query["raw"]

    const communities = await db_con.env_db("communities")
        .where({ platform: category, user_community: 0, type: "main" })
        .orWhere(function () {
            if (category === "3ds" || category === "wiiu") {
                this.orWhere({ platform: "both" })
            }
        })
        .orderBy("communities.create_time", "desc")
        .offset(offset)
        .limit(limit)

    if (raw) {
        if (communities.length <= 0) {
            res.sendStatus(204);
            return;
        }

        generate_partial.generate_community_partial(res, communities);
        return;
    }

    switch (category) {
        case "wiiu":
            res.render("pages/communities/categories/wiiu.ejs", {
                communities: communities
            })
            break;
        case "3ds":
            res.render("pages/communities/categories/3ds.ejs", {
                communities: communities
            })
            break;
        case "vc":
            res.render("pages/communities/categories/vc.ejs", {
                communities: communities
            })
            break;
    }
})

route.get("/:community_id", async (req, res) => {
    const community_id = req.params.community_id;
    const offset = parseInt(req.query["offset"]) || 0;
    const limit = parseInt(req.query["limit"]) || 25;
    const raw_html = req.query["raw"];

    const community_data_query = db_con
        .env_db("communities")
        .select("communities.*")
        .select(db_con.env_db.raw(`EXISTS (SELECT 1 FROM posts WHERE community_id = communities.id AND in_game = 1) as ingame_posts`))
        .where({ "communities.id": community_id });

    if (!res.locals.guest_mode) {
        community_data_query.select(
            common_querys.is_favorited(res.locals.user.id)
        );
    }

    const community_data = await community_data_query.first();

    var play_journal_posts, ingame_posts, recent_drawings, normal_posts;

    if (res.locals.guest_mode) {
        play_journal_posts = await common_querys.posts_query
            .clone()
            .where({ community_id: community_id, is_journal: 1 })
            .orderBy("empathy_count", "desc")
            .limit(3);

        ingame_posts = await common_querys.posts_query
            .clone()
            .where({ community_id: community_id })
            .whereNotNull("posts.app_data")
            .orderBy("posts.create_time", "desc")
            .limit(3);

        recent_drawings = await common_querys.posts_query
            .clone()
            .where({ community_id: community_id })
            .whereNotNull("posts.painting_cdn_url")
            .orderBy("posts.create_time", "desc")
            .limit(6);
    } else {
        normal_posts = await common_querys.posts_query
            .clone()
            .select((res.locals.guest_mode) ? "" : common_querys.is_yeahed(res.locals.user.id))
            .where({ community_id: community_id })
            .orderBy("posts.create_time", "desc")
            .limit(limit)
            .offset(offset);

        if (raw_html) {
            if (normal_posts.length <= 0) {
                res.sendStatus(204);
                return;
            }

            generate_partial.generate_posts_partial(res, normal_posts, false)
            return;
        }
    }

    res.render("pages/community.ejs", {
        community: community_data,

        recent_drawings: recent_drawings,
        play_journal_posts: play_journal_posts,
        ingame_posts: ingame_posts,
        normal_posts: normal_posts,

        tab: ""
    });
});

route.get("/:community_id/:tab", async (req, res) => {
    const raw_html = req.query["raw"];
    const offset = parseInt(req.query["offset"]) || 0;
    const limit = parseInt(req.query["limit"]) || 10;

    var community = db_con.env_db("communities")
        .select("*")
        .select(db_con.env_db.raw(`EXISTS (SELECT 1 FROM posts WHERE community_id = communities.id AND in_game = 1) as ingame_posts`))
        .where({ id: req.params.community_id })
        .first()

    if (!res.locals.guest_mode) {
        community.select(common_querys.is_favorited(res.locals.user.id))
    }

    community = await community

    if (!community) {
        res.render("pages/errors/common/404.ejs");
        return;
    }

    var posts;

    switch (req.params.tab) {
        case "journal":
            posts = common_querys.posts_query.clone()
            posts.where({ is_journal: 1 })
            break;
        case "paintings":
            posts = common_querys.posts_query.clone().whereNotNull("painting_cdn_url");
            break;
        case "hot":
            if (!req.query["date"]) {
                req.query["date"] = moment().format("YYYY-MM-DD")
            } else {
                req.query["date"] = moment(req.query["date"]).format("YYYY-MM-DD")
            }
            posts = common_querys.posts_query.clone().whereBetween("posts.create_time", [req.query["date"], moment(req.query["date"]).add("1", "day").format("YYYY-MM-DD")]).orderBy("empathy_count", "desc")
            break;
        case "ingame":
            posts = common_querys.posts_query.clone().where({ in_game: 1 });
            break;
        case "recent":
            posts = common_querys.posts_query.clone()
            break;
        default:
            res.render("pages/errors/common/404.ejs");
            return;
    }

    posts
        .where({ community_id: req.params.community_id })
        .orderBy("posts.create_time", "desc")
        .offset(offset)
        .limit(limit)

    if (!res.locals.guest_mode) {
        posts.select(common_querys.is_yeahed(res.locals.user.id))
    }

    posts = await posts;

    if (raw_html) {
        if (posts.length <= 0) {
            res.sendStatus(204);
            return;
        }

        generate_partial.generate_posts_partial(res, posts, false)
        return;
    }

    res.render("pages/community_tab.ejs", {
        community: community,
        posts: posts,
        tab: req.params.tab,
        date_query: req.query["date"]
    })
})

module.exports = route;
