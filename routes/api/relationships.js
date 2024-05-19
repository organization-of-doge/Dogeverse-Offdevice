const express = require("express");
const route = express.Router();
const bodyParser = require("body-parser");

const logger = require("../../middleware/log");
const db_con = require("../../../shared_config/database_con");

const disallow_guest = require("../../middleware/disallow_guest");

route.post("/friend/:username", disallow_guest, async (req, res) => {
    //Getting the correct account to send the request to.
    const to_username = req.params.username;
    const to_user = await db_con
        .account_db("accounts")
        .where({ username: to_username })
        .first();

    //If the user doesn't exist, send an error.
    if (!to_user) {
        res.status(404).send({ success: false, error: "NULL_USER" });
    }

    logger.info(
        `${res.locals.user.username} is sending a friend request to ${to_user.username}.`
    );

    //Making sure a friendship between the two users doesn't already exist. If it does, throw an error.
    const current_relationship = await db_con
        .env_db("relationships")
        .where({
            from_account_id: res.locals.user.id,
            to_account_id: to_user.id,
            type: "friendship",
        })
        .first();

    if (current_relationship) {
        res.status(400).send({ success: false, error: "ALREADY_EXISTS" });
        return;
    }

    if (to_nnid === res.locals.user.nnid) {
        res.status(400).send({ success: false, error: "ALREADY_SENDER" });
        return;
    }

    await db_con.env_db("relationships").insert({
        from_account_id: res.locals.user.id,
        to_account_id: to_user.id,
        status: "pending",
        type: "friendship",
    });

    res.status(201).send({ success: true });
});

route.post("/friend/:id/:action", async (req, res) => {
    const relationship_id = req.params.id;
    const action = req.params.action;

    if (action !== "accept" && action !== "decline") {
        res.status(400).send({ success: false, error: "INVALID_ACTION" });
        return;
    }

    //Make sure the relationship is actually their own and is a friend request before accepting.
    const current_relationship = await db_con
        .env_db("relationships")
        .where({
            id: relationship_id,
        })
        .first();

    if (current_relationship.to_account_id !== res.locals.user.id) {
        res.status(401).send({ success: false, error: "DOES_NOT_OWN" });
        return;
    }
    if (current_relationship.type !== "friendship") {
        res.status(400).send({ success: false, error: "INVALID_TYPE" });
        return;
    }
    if (current_relationship.status !== "pending") {
        res.status(400).send({ success: false, error: "ALREADY_EXISTS" });
        return;
    }

    //Once we have figured out that the relationship is a pending friendship request that the user owns
    //We can now accept/decline it.
    switch (action) {
        case "accept":
            await db_con
                .env_db("relationships")
                .update({ status: "accepted" })
                .where({ id: relationship_id });
            res.status(200).send({ success: true, status: "ACCEPTED" });
            break;
        case "decline":
            await db_con
                .env_db("relationships")
                .update({ status: "declined" })
                .where({ id: relationship_id });
            res.status(200).send({ success: true, status: "DECLINED" });
            break;
        default:
            res.status(404).send({ success: false, error: "INVALID_REQUEST" });
            return;
    }
});

route.post("/follow/:username", async (req, res) => {
    //Getting the correct account to follow.
    const username = req.params.username;

    const to_user = await db_con
        .account_db("accounts")
        .where({
            username: username,
        })
        .first();

    //If the user doesn't exist, send an error.
    if (!to_user) {
        res.status(404).send({ success: false, error: "NULL_USER" });
        return;
    }

    //Checking to see if a follow does exist. If it does, then we will simply delete it. If it doesn't
    //Then we'll create a new one and have it automatically get accepted, since pending follow requests
    //Are not a thing.
    const current_follow = await db_con
        .env_db("relationships")
        .where({
            from_account_id: res.locals.user.id,
            to_account_id: to_user.id,
            type: "follow",
        })
        .first();

    if (current_follow) {
        //Deleting the old follow.
        await db_con
            .env_db("relationships")
            .where({
                from_account_id: res.locals.user.id,
                to_account_id: to_user.id,
                type: "follow",
            })
            .delete();

        res.status(200).send({ success: true, follow_status: "DELETED" });
        logger.info(
            `${res.locals.user.username} unfollowed ${to_user.username}.`
        );
    } else {
        //Creating a new follow with an accepted status.
        await db_con.env_db("relationships").insert({
            from_account_id: res.locals.user.id,
            to_account_id: to_user.id,
            type: "follow",
            status: "accepted",
        });

        res.status(201).send({ success: true, follow_status: "CREATED" });
        logger.info(
            `${res.locals.user.username} followed ${to_user.username}.`
        );
    }
});

module.exports = route;
