const express = require("express")
const route = express.Router()
const db_con = require("../../../shared_config/database_con")

route.post("/:community_id/favorite", async (req, res) => {
    const community = (await db_con.env_db("communities").where({id : req.params.community_id}))[0]
    if (!community) {res.status(404).send({success : false, error : "NULL_COMMUNITY"}); return;}

    const current_favorite = (await db_con.env_db("favorites").where({account_id : res.locals.user.id, community_id : req.params.community_id}))[0]

    if (current_favorite) {
        //If there is a favorite, we need to delete the old one

        await db_con.env_db("favorites").where({account_id : res.locals.user.id, community_id : req.params.community_id}).delete()
        res.status(200).send({success : true, favorite_status : "DELETED"})
    } else {
        //If there isn't, then we need to create a new ne

        await db_con.env_db("favorites").insert({
            account_id : res.locals.user.id,
            community_id : req.params.community_id
        })
        res.status(201).send({success : true, favorite_status : "CREATED"})
    }
})

module.exports = route