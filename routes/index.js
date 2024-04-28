module.exports = [
    {
        path: "/",
        route: require("./pages/index")
    },

    {
        path: "/communities",
        route: require("./pages/communities")
    },

    {
        path: "/api/oauth",
        route: require("./api/oauth")
    },

    {
        path: "/api/posts",
        route: require("./api/posts")
    }
]