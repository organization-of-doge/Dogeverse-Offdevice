const express = require('express');
const route = express.Router();
const logger = require("../../middleware/log")
const auth_token = require("../../utils/auth_token")
const db_con = require("../../../shared_config/database_con")
const crypto = require("crypto")

route.post("/retrieve_token", async (req, res) => {
    const nnid = req.get("auth-network-id")
    const password = req.get("auth-password")

    //Verifying the nnid and password are correct
    const account = (await db_con.account_db("accounts").where({nnid : nnid}))[0];
    if (!account) { res.status(404).send({success : false, error : "NO_ACCOUNT_FOUND"}); logger.error(`No account found for nnid: ${nnid}`); return; }
    const passwordHash = crypto.createHash('sha256').update(password + account.password_salt).digest('hex');

    //If they are, then generate the new token, and send it to the client.
    if (passwordHash == account.password_hash) {
        const token = auth_token.generate_auth_token(account)

        res.status(200).send({success : true, token : token})
    } else {
        //If they're not, then send an error to the client
        res.status(403).send({success : false, error : "PASSWORD_MISMATCH"})
    }
})

module.exports = route