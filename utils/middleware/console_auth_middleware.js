const colors = require('colors');
const moment = require('moment');
const db_con = require("../database_con")

async function auth(req, res, next) {
    if (req.path.includes("img") || req.path.includes("css") || req.path.includes("js") || (req.path.includes("v1") && req.path.includes("users"))) { next(); return; }

    //Assigning variables
    var param_pack = req.get('x-nintendo-parampack');
    var service_token = req.get('x-nintendo-servicetoken')

    //Check if the request is faulty or not.
    if (!service_token || !param_pack || service_token.length < 42) { res.sendStatus(401); console.log("[ERROR] (%s) Recieved either no Param Pack, no Service Token, or invalid Service Token.".red, moment().format("HH:mm:ss")); return;}

    service_token = service_token.slice(0, 42);

    //Translating Param_Pack into a more readable format to collect data from.
    var base64Result = (Buffer.from(param_pack, 'base64').toString()).slice(1, -1).split("\\");
    req.param_pack = {};
    req.service_token = service_token;

    for (let i = 0; i < base64Result.length; i += 2) {
        req.param_pack[base64Result[i].trim()] = base64Result[i + 1].trim();
    }

    //Grabbing the correct account
    var account;
    switch (parseInt(req.param_pack.platform_id)) {
        case 0:
            req.platform = "3ds";
            account = await db_con.account_db("accounts").select("*").where({"3ds_service_token" : service_token});
            break;
        case 1:
        default:
            req.platform = "wiiu";
            account = await db_con.account_db("accounts").select("*").where({wiiu_service_token : service_token});
            break;
    }

    //Grabbing account from database

    //If there is no account AND the request isn't creating an account, then send a 401 (Unauthorized)
    if (!account[0] && !req.path.includes("account") && !req.path.includes("people")) { res.redirect("/account/create_account"); return; }
    if (req.path.includes("account") || (req.path.includes("people") && !req.path.includes("people/update"))) {next(); return;}

    //Finally, set the requests account to be the newly found account from the database
    req.account = account;

    req.account.all_notifications = []
    req.account.unread_notifications = []
    req.account.empathies_given = []

    //Make sure the account is accessing the correct environment.

    if (JSON.parse(process.env.ENVIRONMENT)['ENV_NAME'] != account[0].environment) {
        res.send("Wrong Environment!").status(401);
        return;
    }

    next();
}

module.exports = auth