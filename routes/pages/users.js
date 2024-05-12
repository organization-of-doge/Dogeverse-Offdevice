const express = require("express");
const route = express.Router();
const moment = require("moment");
const ejs = require("ejs");

const db_con = require("../../../shared_config/database_con");

async function get_user_data(req, res, next) {
    //Setting all this information, since all pages here will require it, and repeating code is messy.
    res.locals.view_user = await db_con
        .account_db("accounts")
        .where({ nnid: req.params.nnid })
        .first();

    res.locals.view_user_stats = await db_con
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
            "accounts.id": res.locals.view_user.id,
        })
        .first();

    res.locals.view_user_favorites = await db_con
        .env_db("favorites")
        .select(
            "communities.name as community_name",
            "communities.cdn_icon_url",
            "communities.id as community_id"
        )
        .where({ "favorites.account_id": res.locals.view_user.id })
        .innerJoin(
            "communities",
            "communities.id",
            "=",
            "favorites.community_id"
        );

    return next();
}

route.get("/:nnid", get_user_data, async (req, res) => {
    var user_posts_base_query = db_con
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
            db_con.env_db.raw(
                "(SELECT COUNT(empathies.post_id) FROM empathies WHERE empathies.post_id=posts.id) as empathy_count"
            )
        )
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .innerJoin("communities", "communities.id", "=", "posts.community_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id")
        .limit(3);

    var user_posts = user_posts_base_query
        .clone()
        .where({ "posts.account_id": res.locals.view_user.id })
        .orderBy("posts.create_time", "desc");
    var user_empathies = user_posts_base_query
        .clone()
        .where({ "empathies.account_id": res.locals.view_user.id })
        .orderBy("empathies.create_time", "desc");

    if (!res.locals.guest_mode) {
        user_posts.select(
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
        );

        user_empathies.select(
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
        );
    }

    user_posts = await user_posts;
    user_empathies = await user_empathies;

    res.render("pages/users/user.ejs", {
        view_user_posts: user_posts,
        view_user_empathies: user_empathies,
        view_user: res.locals.view_user,
        view_user_favorites: res.locals.view_user_favorites,
        view_user_stats: res.locals.view_user_stats,
    });
});

route.get("/:nnid/posts", get_user_data, async (req, res) => {
    const limit = req.query["limit"] || 25;
    const offset = req.query["offset"] || 0;
    const raw = req.query["raw"] || 0;

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
        .where({ "posts.account_id": res.locals.view_user.id })
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .innerJoin("communities", "communities.id", "=", "posts.community_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id")
        .orderBy("posts.create_time", "desc")
        .limit(limit)
        .offset(offset);

    if (!res.locals.guest_mode) {
        user_posts.select(
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
        );
    }

    user_posts = await user_posts;

    if (raw) {
        if (!user_posts.length) {
            res.sendStatus(204);
            return;
        }

        var html = "",
            show_community,
            last_community_id;

        for (const post of user_posts) {
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

    res.render("pages/users/user_posts.ejs", {
        view_user_posts: user_posts,
        view_user: res.locals.view_user,
        view_user_favorites: res.locals.view_user_favorites,
        view_user_stats: res.locals.view_user_stats,
    });
});

route.get("/:nnid/empathies", get_user_data, async (req, res) => {
    const limit = req.query["limit"] || 25;
    const offset = req.query["offset"] || 0;
    const raw = req.query["raw"] || 0;

    var user_empathies = db_con
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
            db_con.env_db.raw(
                "(SELECT COUNT(empathies.post_id) FROM empathies WHERE empathies.post_id=posts.id) as empathy_count"
            )
        )
        .where({ "empathies.account_id": res.locals.view_user.id })
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .innerJoin("communities", "communities.id", "=", "posts.community_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id")
        .orderBy("empathies.create_time", "desc")
        .limit(limit)
        .offset(offset);

    if (!res.locals.guest_mode) {
        user_empathies.select(
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
        );
    }

    user_empathies = await user_empathies;

    if (raw) {
        if (!user_empathies.length) {
            res.sendStatus(204);
            return;
        }

        var html = "",
            show_community,
            last_community_id;

        for (const post of user_empathies) {
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

    res.render("pages/users/user_empathies.ejs", {
        view_user_empathies: user_empathies,
        view_user: res.locals.view_user,
        view_user_favorites: res.locals.view_user_favorites,
        view_user_stats: res.locals.view_user_stats,
    });
});

module.exports = route;
