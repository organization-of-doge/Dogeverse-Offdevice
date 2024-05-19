const express = require("express");
const route = express.Router();
const logger = require("../../middleware/log");
const auth_token = require("../../utils/auth_token");
const db_con = require("../../../shared_config/database_con");
const crypto = require("crypto");
const multer = require("multer");
const axios = require("axios");
const cdn_upload = require("../../utils/cdn_upload");
const path = require("path");

route.post("/retrieve_token", async (req, res) => {
    const username = req.get("auth-network-id");
    const password = req.get("auth-password");

    //Verifying the nnid and password are correct
    const account = (
        await db_con.account_db("accounts").where({ username: username })
    )[0];
    if (!account) {
        res.status(404).send({ success: false, error: "NO_ACCOUNT_FOUND" });
        logger.error(`No account found for username: ${username}`);
        return;
    }
    const passwordHash = crypto
        .createHash("sha256")
        .update(password + account.password_salt)
        .digest("hex");

    //If they are, then generate the new token, and send it to the client.
    if (passwordHash == account.password_hash) {
        const token = auth_token.generate_auth_token(account);

        res.status(200).send({ success: true, token: token });
    } else {
        //If they're not, then send an error to the client
        res.status(403).send({ success: false, error: "PASSWORD_MISMATCH" });
    }
});

route.post("/create", multer().none(), async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const nickname = req.body.nickname;

    if (!username || !email || !password || !nickname) {
        res.redirect("/errors/account/retry");
    }

    //Checking to make sure account doesn't already exist with name nnid or email
    if (
        (
            await db_con
                .account_db("accounts")
                .where({ username: username })
                .orWhere({ email: email })
        )[0]
    ) {
        res.redirect("/errors/account/already_exists");
        return;
    }

    //Hashing and Salting the password
    const salt = crypto.randomBytes(8).toString("hex");
    const password_hash = crypto
        .createHash("sha256")
        .update(password + salt)
        .digest("hex");

    const profile_image_url = await cdn_upload.uploadImage(
        path.join(__dirname + "/./defaults/default_image.png"),
        "cdn/users/profile/images/"
    );

    logger.info("Saved profile picture.");

    const new_account = (
        await db_con.account_db("accounts").where(
            "id",
            "=",
            (
                await db_con.account_db("accounts").insert({
                    username: username,
                    mii_name: nickname,

                    password_hash: password_hash,
                    password_salt: salt,

                    email: email,
                    cdn_profile_normal_image_url: profile_image_url.secure_url,
                    cdn_profile_happy_image_url: profile_image_url.secure_url,
                    cdn_profile_like_image_url: profile_image_url.secure_url,
                    cdn_profile_surprised_image_url:
                        profile_image_url.secure_url,
                    cdn_profile_frustrated_image_url:
                        profile_image_url.secure_url,
                    cdn_profile_puzzled_image_url: profile_image_url.secure_url,
                })
            )[0]
        )
    )[0];

    const token = auth_token.generate_auth_token(new_account);

    res.setHeader("Set-Cookie", `jwt=${token}; Path=/;`);
    res.redirect("/");
});

module.exports = route;
