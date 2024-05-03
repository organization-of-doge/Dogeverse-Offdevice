module.exports = [
    {
        path: "/api/oauth",
        route: require("./api/oauth")
    },

    {
        path: "/api/posts",
        route: require("./api/posts")
    },

    {
        path: "/guides",
        route: require("./pages/guides")
    },

    {
        path: "/",
        route: require("./pages/index")
    },

    {
        path: "/communities",
        route: require("./pages/communities")
    },

    {
        path: "/errors",
        route: require("./pages/errors")
    }
]