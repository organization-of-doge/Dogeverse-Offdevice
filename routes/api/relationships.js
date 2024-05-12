const express = require("express");
const route = express.Router();
const bodyParser = require("body-parser");

const logger = require("../../middleware/log");
const db_con = require("../../../shared_config/database_con");

const fs = require("fs");

const cdn_upload = require("../../utils/cdn_upload");
const moment = require("moment");
const multer = require("multer");
const ejs = require("ejs");
const disallow_guest = require("../../middleware/disallow_guest");

route.post("/friend", bodyParser.json(), disallow_guest, async (req, res) => {
    const to_nnid = req.body.to_nnid;
});
