const express = require("express");
const route = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");

const logger = require("../../middleware/log");
const db_con = require("../../utils/database_con");
const upload_cdn_asset = require("../../utils/cdn_upload")

const disallow_guest = require("../../middleware/disallow_guest");

route.post("/profile", disallow_guest, multer().any(), async (req, res) => {
    const { mii_name, bio, email, language, pronouns, allow_friend, empathy_notification, relationship_visible } = req.body
    const profile_image = req.files[0]

    const update_data = {
        mii_name: mii_name,
        bio: bio,
        email: email,
        language: language,
        pronouns: pronouns,
        allow_friend: allow_friend,
        empathy_notification: empathy_notification,
        relationship_visible: relationship_visible
    }

    if (profile_image) {
        if (!profile_image.mimetype.includes("image/")) {
            logger.error(`${res.locals.user.username} tried uploading image with mime type of ${profile_image.mimetype}`);
            res.status(400).send({ success: false, error: "UNVALID_MIME" });
            return;
        }

        const base64_data = `data:${profile_image.mimetype};base64,${Buffer.from(profile_image.buffer).toString("base64")}`

        const { secure_url } = await upload_cdn_asset.uploadImage(base64_data, "cdn/users/profile/images/")

        update_data.cdn_profile_normal_image_url = secure_url
        update_data.cdn_profile_happy_image_url = secure_url
        update_data.cdn_profile_like_image_url = secure_url
        update_data.cdn_profile_surprised_image_url = secure_url
        update_data.cdn_profile_frustrated_image_url = secure_url
        update_data.cdn_profile_puzzled_image_url = secure_url
    }

    await db_con.account_db("accounts").update(update_data).where({ id: res.locals.user.id });

    res.redirect("/users/@me/settings");
})

module.exports = route