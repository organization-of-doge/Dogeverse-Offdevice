const express = require("express");
const app = express();

const logger = require("./middleware/log");
const routes = require("./routes/index");
const path = require("path");

const auth = require("./utils/middleware/web_auth");
const cookie_parser = require("cookie-parser");

logger.log("Using middleware.");
app.use(logger.http_log);

app.set("view engine", "ejs");
app.use(cookie_parser());
app.use(auth);

logger.log("Creating all web routes.");

app.use(express.static(path.join(__dirname, "/static")));

for (const route of routes) {
    app.use(route.path, route.route);
}

//Set our app to listen on the config port
app.listen(process.env.PORT, () => {
    console.log(
        "[INFO] Current Environment: %s. Listening on port %d".green,
        JSON.parse(process.env.ENVIRONMENT)["ENV_NAME"],
        process.env.PORT
    );
});
