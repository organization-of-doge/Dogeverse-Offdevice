const express = require("express")
const route = express.Router()

route.get("/account/:error_id", async (req, res) => {
    switch (req.params.error_id) {
        case "retry":
            res.render("pages/errors/account/retry.ejs");
            break;
        case "already_exists":
            res.render("pages/errors/account/already_exists.ejs");
            break;
        case "nnid":
            res.render("pages/errors/account/nnid.ejs");
            break;
        default:
            res.sendStatus(404);
    }
})

module.exports = route