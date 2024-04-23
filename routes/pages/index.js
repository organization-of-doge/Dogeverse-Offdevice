const express = require('express');
const route = express.Router();
const moment = require('moment');

const db_con = require("../../../shared_config/database_con")

route.get("/", async (req, res) => {
    const popular_communities = await db_con.env_db.select("*").from("communities AS c").where({ type: "main" }).whereNot({id : 0}).orderBy(function () {
        this.count("community_id").from("posts").whereRaw("community_id = `c`.id").whereBetween("create_time", [moment().subtract(5, "days").format("YYYY-MM-DD HH:mm:ss"), moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss")])
    }, "desc").limit(4)

    const newest_communities = await db_con.env_db("communities").orderBy("communities.create_time", "desc")

    res.render("pages/index.ejs", {
        popular_communities : popular_communities,
        newest_communities : newest_communities
    })
})

route.get("/login", (req, res) => {
    //Check to make sure the user isn't already logged in.
    if (res.locals.user) {res.redirect("/")}

    res.render("pages/account/login.ejs")
})

module.exports = route