const db_con = require("./database_con");

const common_querys = {
    posts_query: db_con
        .env_db("posts")
        .select(
            "posts.*",
            "accounts.mii_name",
            "accounts.nnid",
            "accounts.username",
            "accounts.cdn_profile_normal_image_url",
            "accounts.cdn_profile_happy_image_url",
            "accounts.cdn_profile_like_image_url",
            "accounts.cdn_profile_frustrated_image_url",
            "accounts.cdn_profile_puzzled_image_url",
            "accounts.cdn_profile_surprised_image_url",
            "accounts.admin",
            "communities.name as community_name",
            "communities.cdn_icon_url",
            "communities.id as community_id",
            db_con.env_db.raw(
                "(SELECT COUNT(empathies.post_id) FROM empathies WHERE empathies.post_id=posts.id) as empathy_count"
            )
        )
        .groupBy("posts.id")
        .innerJoin("account.accounts", "accounts.id", "=", "posts.account_id")
        .innerJoin("communities", "communities.id", "=", "posts.community_id")
        .leftJoin("empathies", "posts.id", "=", "empathies.post_id"),

    is_yeahed: function (account_id) {
        return db_con.env_db.raw(
            `EXISTS ( 
                    SELECT 1
                    FROM empathies
                    WHERE empathies.account_id=?
                    AND empathies.post_id=posts.id
                ) AS empathied_by_user
            `,
            [account_id]
        );
    },

    get_user_stats: function (account_id) {
        return db_con
            .env_db("account.accounts")
            .select(
                db_con.env_db.raw(
                    "(SELECT COUNT(*) FROM posts WHERE posts.account_id = accounts.id) as post_count"
                ),
                db_con.env_db.raw(
                    "(SELECT COUNT(*) FROM empathies WHERE empathies.account_id = accounts.id) as empathy_count"
                ),
                db_con.env_db.raw(
                    "(SELECT COUNT(*) FROM relationships WHERE (relationships.from_account_id = accounts.id OR relationships.to_account_id = accounts.id) AND relationships.type = 'friendship' AND relationships.status = 'accepted') as friend_count"
                ),
                db_con.env_db.raw(
                    "(SELECT COUNT(*) FROM relationships WHERE relationships.to_account_id = accounts.id AND relationships.type = 'follow' AND relationships.status = 'accepted') as followers_count"
                ),
                db_con.env_db.raw(
                    "(SELECT COUNT(*) FROM relationships WHERE relationships.from_account_id = accounts.id AND relationships.type = 'follow' AND relationships.status = 'accepted') as following_count"
                )
            )
            .where({
                "accounts.id": account_id,
            })
            .first();
    },
};

module.exports = common_querys;
