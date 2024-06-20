module.exports = [
    {
        path: "/api/oauth",
        route: require("./api/oauth"),
    },

    {
        path: "/api/posts",
        route: require("./api/posts"),
    },

    {
        path: "/api/communities",
        route: require("./api/communities"),
    },

    {
        path: "/api/relationships",
        route: require("./api/relationships"),
    },

    {
        path: "/guides",
        route: require("./pages/guides"),
    },

    {
        path: "/",
        route: require("./pages/index"),
    },

    {
        path: "/communities",
        route: require("./pages/communities"),
    },

    {
        path: "/users",
        route: require("./pages/users"),
    },

    {
        path: "/search",
        route: require("./pages/search"),
    },

    {
        path: "/errors",
        route: require("./pages/errors"),
    },

    {
        path: "/posts",
        route: require("./pages/posts"),
    },
];
