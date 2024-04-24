const express = require('express');
const route = express.Router();
const moment = require('moment');

const db_con = require("../../../shared_config/database_con")

route.get("/", async (req, res) => {
    const popular_communities = await db_con.env_db.select("*").from("communities AS c").where({ type: "main" }).whereNot({id : 0}).orderBy(function () {
        this.count("community_id").from("posts").whereRaw("community_id = `c`.id").whereBetween("create_time", [moment().subtract(5, "days").format("YYYY-MM-DD HH:mm:ss"), moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss")])
    }, "desc").limit(4)

    const newest_communities_wiiu = await db_con.env_db("communities").where({platform : "wiiu", type : "main"}).orderBy("communities.create_time", "desc").limit(6)
    const newest_communities_3ds = await db_con.env_db("communities").where({platform : "3ds", type : "main"}).orderBy("communities.create_time", "desc").limit(6)

    res.render("pages/index.ejs", {
        popular_communities : popular_communities,
        newest_communities_wiiu : newest_communities_wiiu,
        newest_communities_3ds : newest_communities_3ds
    })
})

route.get("/login", (req, res) => {
    //Check to make sure the user isn't already logged in.
    if (res.locals.user) {res.redirect("/")}

    res.render("pages/account/login.ejs")
})

module.exports = route