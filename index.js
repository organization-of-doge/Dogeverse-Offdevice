const express = require("express")
const app = express();

const logger = require('./middleware/log');
const routes = require("./routes/index");
const path = require("path")

logger.log("Using middleware.");
app.use(logger.http_log);

logger.log("Creating all web routes.");

app.use(express.static(path.join(__dirname, "/static")))
app.use(express.static(path.join(__dirname, "../CDN_Files/")));

for (const route of routes) {
    app.use(route.path, route.route)
}

app.get("/", (req, res) => {
    res.send("This means that it is working.")
})

//Set our app to listen on the config port
app.listen(process.env.PORT, () => {
    console.log("[INFO] Current Environment: %s. Listening on port %d".green, JSON.parse(process.env.ENVIRONMENT)['ENV_NAME'], process.env.PORT);
})
