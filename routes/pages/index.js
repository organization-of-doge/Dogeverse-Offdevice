const express = require("express");
const route = express.Router();
const moment = require("moment");

const db_con = require("../../../shared_config/database_con");
const common_querys = require("../../utils/common_querys");

route.get("/", async (req, res) => {
    const popular_communities = await db_con.env_db
        .select("*")
        .from("communities AS c")
        .where({ type: "main" })
        .whereNot({ id: 0 })
        .orderBy(function () {
            this.count("community_id")
                .from("posts")
                .whereRaw("community_id = `c`.id")
                .whereBetween("create_time", [
                    moment().subtract(5, "days").format("YYYY-MM-DD HH:mm:ss"),
                    moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
                ]);
        }, "desc")
        .limit(4);

    const newest_communities_wiiu = await db_con
        .env_db("communities")
        .where({ platform: "wiiu", type: "main" })
        .orderBy("communities.create_time", "desc")
        .limit(6);
    const newest_communities_3ds = await db_con
        .env_db("communities")
        .where({ platform: "3ds", type: "main" })
        .orderBy("communities.create_time", "desc")
        .limit(6);
    const special_communities = await db_con
        .env_db("communities")
        .where({ special_community: 1 })
        .orderBy("communities.create_time", "desc")
        .limit(6);

    const base_posts_query = common_querys.posts_query
        .clone()
        .orderBy("posts.create_time", "desc")
        .limit(5);

    const announcement_posts = await base_posts_query
        .clone()
        .where({ "communities.type": "announcement", "accounts.admin": 1 });
    const featured_paintings = await base_posts_query
        .clone()
        .where({ "posts.featured": 1 })
        .whereNotNull("posts.painting_cdn_url");
    const featured_posts = await base_posts_query
        .clone()
        .where({ "posts.featured": 1 })
        .whereNull("posts.painting_cdn_url");

    var user_favorites;

    if (!res.locals.guest_mode) {
        user_favorites = await db_con
            .env_db("favorites")
            .select(
                "favorites.*",
                "communities.name as community_name",
                "communities.id as community_id",
                "communities.cdn_icon_url"
            )
            .where({ "favorites.account_id": res.locals.user.id })
            .innerJoin(
                "communities",
                "communities.id",
                "=",
                "favorites.community_id"
            )
            .orderBy("favorites.create_time", "desc")
            .limit(8);
    }

    res.render("pages/index.ejs", {
        popular_communities: popular_communities,
        newest_communities_wiiu: newest_communities_wiiu,
        newest_communities_3ds: newest_communities_3ds,
        special_communities: special_communities,

        announcement_posts: announcement_posts,
        featured_paintings: featured_paintings,
        featured_posts: featured_posts,

        user_favorites: user_favorites,
    });
});

route.get("/login", (req, res) => {
    //Check to make sure the user isn't already logged in.
    if (res.locals.user) {
        res.redirect("/");
    }

    res.render("pages/account/login.ejs");
});

route.get("/signup", (req, res) => {
    //Check to make sure the user isn't already logged in.
    if (res.locals.user) {
        res.redirect("/");
    }

    res.render("pages/account/signup.ejs");
});

module.exports = route;
