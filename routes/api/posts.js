const express = require('express');
const route = express.Router();
const bodyParser = require("body-parser")

const logger = require('../../middleware/log');
const db_con = require('../../../shared_config/database_con');

const fs = require("fs");

const cdn_upload = require("../../utils/cdn_upload")
const moment = require("moment")
const multer = require("multer")
const ejs = require("ejs")

route.post("/", bodyParser.json({limit : "5mb"}), async (req, res) => {
    const community_id = req.body.community_id;
    const feeling_id = req.body.feeling_id;
    const spoiler = req.body.spoiler;
    const title_owned = req.body.owns_title;

    const topic_tag = req.body.topic_tag;
    const body = req.body.body;
    const screenshot = req.body.screenshot;
    var platform;

    if (title_owned == undefined || spoiler == undefined || feeling_id == undefined || community_id == undefined) {
        logger.error(`No title_owned, spoiler, feeling_id, or community_id from ${res.locals.user.nnid}`);
        res.status(400).send({success: false, error : "MISSING_VALUES"});
        return;
    }
    if (!body) {
        logger.error(`No body from ${res.locals.user.nnid}`);
        res.status(400).send({success : false, error : "NO_BODY_OR_PAINTING"});
        return;
    }

    const community = (await db_con.env_db("communities").where({id : community_id}))[0]

    if (community.post_type == "text" && painting) { res.status(400).send({success : false, error : "TEXT_ONLY"}); logger.error("Text only community!"); return;}
    if (community.post_type == "memo" && body) { res.status(400).send({success : false, error : "PAINTING_ONLY"}); logger.error("Memo only community!"); return;}
    if (community.type == "announcement" && res.locals.user.admin == 0) { res.status(400).send({success : false, error : "ANNOUNCEMENT_COMMUNITY"}); logger.error(`${req.account[0].nnid} tried to post to ${community.name}`); return; }

    platform = "web"

    const insert_data = {
        account_id : res.locals.user.id,
        pid : res.locals.user.pid,
        
        feeling_id : feeling_id,
        community_id : community_id,
        spoiler : spoiler,

        is_autopost : 0,
        is_app_jumpable : 0
    }

    if (body) { insert_data.body = body } else { insert_data.painting = painting }
    if (screenshot) { insert_data.screenshot = screenshot }
    if (topic_tag) {insert_data.topic_tag = topic_tag }

    //Checking for last post's content, to avoid spam.
    const last_post_content = (await db_con.env_db("posts").where({account_id : res.locals.user.id})
    .whereBetween("create_time", [moment().subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss"), moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss")])
    .orderBy("create_time", "desc").limit(1))[0]

    //Yes I know this is a bad if statement. will come back to it when I can.
    if (last_post_content) {
        if (body && last_post_content.body) {
            if (last_post_content.body.replace(" ", "") == body.replace(" ", "")) {
                res.status(400).send({success : false, error : "SPAM_DETECTED"}); return;
            }
        }
    }

    const post_id = (await db_con.env_db("posts").insert(insert_data))[0]

    logger.info(`${res.locals.user.nnid} posted to ${community.name}`)

    if (screenshot) {
        fs.writeFileSync(__dirname + `/../../../CDN_Files/img/screenshots/${post_id}.jpg`, screenshot, 'base64');
        const screenshot_result = await cdn_upload.uploadImage(__dirname + `/../../../CDN_Files/img/screenshots/${post_id}.jpg`, "screenshots");

        const update_data = {
            screenshot_cdn_url : screenshot_result.secure_url
        }

        await db_con.env_db("posts").update(update_data).where("id", post_id)
        logger.info(`Saved screenshot.`)
    }

    const post = (await db_con.env_db("posts").where({id : post_id}))[0]

    post.nnid = res.locals.user.nnid
    post.mii_hash = res.locals.user.mii_hash
    post.mii_name = res.locals.user.mii_name
    post.account_id = res.locals.user.id
    post.empathy_count = 0
    post.reply_count = 0
    
    const locals = {
        moment : res.locals.moment,
        user : res.locals.user
    }

    const html = await ejs.renderFile(__dirname + "/../../views/partials/elements/ugc/posts.ejs", {
        post : post,
        locals : locals
    })

    res.status(201).send({success : true, post_id : post_id, html : html})
})



module.exports = route