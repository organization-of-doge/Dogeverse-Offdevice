function guest(req, res, next) {
    if (res.locals.user) { return next(); }

    res.render("pages/errors/not_logged_in.ejs")
}

module.exports = guest