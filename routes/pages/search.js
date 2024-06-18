const route = require("express").Router();
const db_con = require("../../utils/database_con");
const ejs = require("ejs");
const common_querys = require("../../utils/common_querys");
const generate_partial = require("../utils/generate_partial");

route.get("/", async (req, res) => {
    const query = `%${req.query["q"].toLowerCase()}%`;
    const original_query = req.query["q"];
    const offset = parseInt(req.query["offset"]) || 0;
    const limit = parseInt(req.query["limit"]) || 8;
    const raw_html = req.query["raw"];

    if (!query) {
        res.status(404).render("pages/errors/search/no_query.ejs");
        return;
    }

    const searched_accounts = await db_con
        .account_db("accounts")
        .whereLike(db_con.env_db.raw("LOWER(mii_name)"), query)
        .orWhereLike(db_con.env_db.raw("LOWER(username)"), query)
        .orWhereLike(db_con.env_db.raw("LOWER(nnid)"), query)
        .orderBy("create_time", "desc")
        .limit(5);
    const searched_posts_query = common_querys.posts_query
        .clone()
        .whereRaw("LOWER(url) LIKE ?", [query])
        .orWhereRaw("LOWER(topic_tag) LIKE ?", [query])
        .orWhereRaw("LOWER(body) LIKE ?", [query])
        .orderBy("posts.create_time", "desc")
        .limit(limit)
        .offset(offset);

    if (!res.locals.guest_mode) {
        searched_posts_query.select(common_querys.is_yeahed(res.locals.user.id));
    }

    const searched_posts = await searched_posts_query;

    const searched_communities = await db_con
        .env_db("communities")
        .whereLike(db_con.env_db.raw("LOWER(name)"), query)
        .orWhereLike(db_con.env_db.raw("LOWER(description)"), query)
        .orWhereLike(db_con.env_db.raw("LOWER(app_name)"), query)
        .orderBy("cdn_ctr_banner_url", "desc")
        .orderBy("create_time", "desc")
        .limit(5);

    if (raw_html) {
        if (searched_posts.length <= 0) {
            res.sendStatus(204);
            return;
        }

        generate_partial.generate_posts_partial(res, searched_posts, true);
        return;
    }

    res.render("pages/search.ejs", {
        searched_accounts: searched_accounts,
        searched_communities: searched_communities,
        searched_posts: searched_posts,
        original_query: original_query,
    });
});

module.exports = route;
