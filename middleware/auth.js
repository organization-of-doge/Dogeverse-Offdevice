const jwt = require("jsonwebtoken");
const db_con = require("../../shared_config/database_con")
const auth_token = require("../utils/auth_token")

async function auth(req, res, next) {
    //Getting all token data
    const token = req.cookies.jwt

    if (!token) { res.locals.guest_mode = true; return next(); }

    const user_data = auth_token.verify_auth_token(token);

    //Error handling
    if (user_data.success === false && user_data.error) {
        res.locals.guest_mode = true; return next();
    }

    const account_data = (await db_con.account_db("accounts").where({id : user_data.data.account_id}))[0]

    res.locals.user = account_data

    return next();
}

module.exports = auth