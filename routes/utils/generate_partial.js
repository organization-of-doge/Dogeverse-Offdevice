const ejs = require("ejs")

const generate_partial = {
    generate_posts_partial: async (res, posts, show_community_arg) => {
        var html = "";
        var show_community, last_community_id;

        for (const post of posts) {
            if (!show_community_arg || post.community_id === last_community_id) {
                show_community = false;
            } else {
                show_community = true;
            }

            html += await ejs.renderFile(
                __dirname + "/../../views/partials/elements/ugc/posts.ejs",
                {
                    post: post,
                    locals: res.locals,
                    show_community: show_community,
                }
            );

            last_community_id = post.community_id;
        }

        res.status(200).send(html);
        return;
    },

    generate_community_partial: async (res, communities, show_banner) => {
        var html = "";

        for (const community of communities) {
            html += await ejs.renderFile(
                __dirname + "/../../views/partials/elements/database-elements/community.ejs",
                {
                    community: community,
                    locals: res.locals,
                    include_banner: show_banner
                }
            );
        }

        res.status(200).send(html);
        return;
    }
}

module.exports = generate_partial