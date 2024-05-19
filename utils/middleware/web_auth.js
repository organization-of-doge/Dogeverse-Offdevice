const jwt = require("jsonwebtoken");
const db_con = require("../database_con");
const auth_token = require("../auth_token");
const moment = require("moment");

async function auth(req, res, next) {
    res.locals.moment = moment;

    //Getting all token data
    const token = req.cookies.jwt;

    if (!token) {
        res.locals.guest_mode = true;
        return next();
    }

    const user_data = auth_token.verify_auth_token(token);

    //Error handling
    if (user_data.success === false && user_data.error) {
        res.locals.guest_mode = true;
        console.log(error);
        return next();
    }

    const account_data = await db_con
        .account_db("accounts")
        .where({ id: user_data.data.account_id })
        .first();

    if (!account_data) {
        res.locals.guest_mode = true;
        return next();
    }

    //Finally, assigning the account data. While we're at it, we'll also give them the moment library so we can do
    //time manipulation in client EJS.
    res.locals.user = account_data;

    return next();
}

module.exports = auth;
