const aquamarine = {
    events: {
        aquamarine_scroll_end: new Event("aquamarine:scroll_end"),
        aquamarine_post_empathy_added: new Event("aquamarine:post_empathy_added")
    },

    router: {
        routes: [],
        connect: function (regex, handler) {
            this.routes.push({ regex: new RegExp(regex), handler: handler });
        },
        checkRoutes: function (url) {
            var matchFound = false;
            for (var i = 0; i < this.routes.length; i++) {
                var route = this.routes[i];
                var match = url.match(route.regex);
                if (match) {
                    matchFound = true;
                    route.handler.apply(null, match.slice(1));
                    break;
                }
            }
        },
    },

    logger: {
        log_initialize: function (str) {
            console.log(`%c[INIT] ${str}`, 'color: #36a8e0')
        },

        log_info: function (str) {
            console.log(`%c[INFO] ${str}`, 'color: #2ec91c')
        },

        log_error: function (str) {
            console.log(`%c[ERROR] ${str}`, 'color: #d13017')
        }
    },

    init: {
        initialize: function () {
            const logout = document.querySelector("#settings-logout");
            const settings = document.querySelector("#settings-button");

            if (logout) {
                logout.addEventListener("click", aquamarine.account.logout);
            }
            if (settings) {
                settings.addEventListener("click", this.nav.toggle_settings_menu);
            }

            this.initialize_href();
        },

        initialize_href: function () {
            aquamarine.logger.log_initialize("Href")

            document.querySelectorAll("[data-href]").forEach((e) => {
                e.removeEventListener("click", this.href.href_click);
                e.addEventListener("click", this.href.href_click);
            });
        },

        initialize_empathies: function () {
            aquamarine.logger.log_initialize("Empathies")

            document.querySelectorAll(".empathy:not(.disabled)[data-post-id]").forEach((e) => {
                e.removeEventListener("click", this.empathies.post_empathy_click);
                e.addEventListener("click", this.empathies.post_empathy_click);
            });

            document.querySelectorAll(".empathy:not(.disabled)[data-reply-id]").forEach((e) => {
                e.removeEventListener("click", this.empathies.reply_empathy_click);
                e.addEventListener("click", this.empathies.reply_empathy_click)
            })
        },

        initialize_add_post: function (file_callback) {
            const feeling_inputs = document.querySelectorAll(".feeling-selector input");
            const file_upload = document.querySelector('input[type="file"]');
            const textarea = document.querySelector("textarea");

            if (!textarea) { return }

            document.querySelectorAll("[data-expand]").forEach((e) => {
                e.addEventListener("click", this.add_post.open_expandable);
            });

            aquamarine.logger.log_initialize("Feeling selector")

            feeling_inputs.forEach((e) => {
                e.addEventListener("click", this.add_post.feeling_selector_click);
            });

            aquamarine.logger.log_initialize("Textarea");

            textarea.addEventListener("input", this.add_post.textarea_input);

            aquamarine.logger.log_initialize("File upload");

            file_upload.addEventListener("change", (event) => {
                this.add_post.file_upload_change(event, file_callback)
            });
        },

        initialize_favorite_button: function () {
            aquamarine.logger.log_initialize("Favorite Button");
            if (document.querySelector("button.favorite-button")) {
                document.querySelector("button.favorite-button").addEventListener("click", this.favorite.favorite_click);
            }
        },

        nav: {
            toggle_settings_menu: function (event) {
                document.querySelector(".settings-menu").classList.toggle("none");
            }
        },

        add_post: {
            file_upload_change: function (event, file_callback) {
                const send_button = document.querySelector(".add-new-post button");
                send_button.setAttribute("disabled", "true");
                var input = event.target;
                const reader = new FileReader();

                reader.readAsDataURL(input.files[0]);

                reader.onload = () => {
                    screenshot = reader.result.split(",")[1];
                    screenshot_MIME = input.files[0].type;
                    send_button.removeAttribute("disabled");

                    file_callback(screenshot, screenshot_MIME)
                };
            },

            textarea_input: function (event) {
                const send_button = document.querySelector(".add-new-post button");

                if (event.target.value.replace(/\s/g, "").length <= 0) {
                    send_button.setAttribute("disabled", "true");
                } else {
                    send_button.removeAttribute("disabled");
                }
            },

            feeling_selector_click: function (event) {
                document.querySelectorAll(".feeling-selector input").forEach((feeling) => {
                    feeling.classList.remove("selected");
                });

                event.target.classList.add("selected");
            },

            open_expandable: function (event) {
                document.querySelectorAll(event.target.getAttribute("data-expand")).forEach((e) => {
                    e.classList.remove("none");
                });
            }
        },

        empathies: {
            post_empathy_click: function (event) {
                event.stopPropagation();
                aquamarine.actions.empathy(event.currentTarget.getAttribute("data-post-id"));
            },

            reply_empathy_click: function (event) {
                event.stopPropagation();
            }
        },

        href: {
            href_click: function (event) {
                window.location.href = event.currentTarget.getAttribute("data-href");
            }
        },

        favorite: {
            favorite_click: function (event) {
                aquamarine.actions.favorite(document.querySelector("button.favorite-button").getAttribute("data-community-id"));
            }
        }
    },

    error: {
        show_error_by_attr: function (attr, callback) {
            const error_text = document.querySelector("span.error-text");

            if (!error_text.getAttribute(attr)) {
                aquamarine.logger.log_error(`Could not find an error locale for ${attr}`);
                return;
            }

            error_text.classList.remove("none");
            error_text.classList.add("transition");

            error_text.innerHTML = error_text.getAttribute(attr);

            setTimeout(() => {
                error_text.classList.remove("transition");

                callback()
            }, 2100);
        }
    },

    account: {
        login: async function () {
            const username = document.querySelector('input[name="username"]').value;
            const password = document.querySelector('input[name="password"]').value;

            const signin = document.querySelector('button[data-role="signin"]');

            if (!username || !password) {
                return;
            }

            aquamarine.logger.log_info(`Logging into new account. WARNING - Please do not send your auth token to ANYONE. No admin will ever ask for it.`)

            const token_data = await fetch("/api/oauth/retrieve_token", {
                method: "POST",
                headers: {
                    "auth-password": password,
                    "auth-network-id": username,
                },
            });

            const token = await token_data.json();

            if (token.success == false) {
                signin.setAttribute("disabled", true);
                switch (token.error) {
                    case "NO_ACCOUNT_FOUND":
                        aquamarine.error.show_error_by_attr("data-no-account", () => signin.removeAttribute("disabled"))
                        break;
                    case "PASSWORD_MISMATCH":
                        aquamarine.error.show_error_by_attr("data-password-mismatch", () => signin.removeAttribute("disabled"))
                        break;
                    default:
                        aquamarine.error.show_error_by_attr("data-default", () => signin.removeAttribute("disabled"))
                        break;
                }
                return;
            }

            this.update_auth_token(token.token, document.querySelector('input[type="checkbox"]').checked)

            const redirect = new URLSearchParams(window.location.search).get(
                "redirect"
            );

            if (redirect) {
                window.location.href = redirect;
            } else {
                window.location.href = "/";
            }
        },

        logout: function () {
            aquamarine.logger.log_info("Logging out of current account.");

            var currentURL = window.location.href;

            document.cookie = "jwt=; Path=/; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

            setTimeout(() => {
                window.location.href = currentURL;
            }, 100);
        },

        update_auth_token: function (token, remember) {
            if (remember) {
                var date = new Date();
                date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);

                document.cookie = `jwt=${token}; Path=/; Secure; SameSite=None; expires=${date.toUTCString()};`;
            } else {
                document.cookie = `jwt=${token}; Path=/; Secure; SameSite=None`;
            }
        },
    },

    actions: {
        empathy: async function (post_id) {
            const post_yeah_button = document.querySelector(`#post-${post_id} button.empathy`);
            const post_yeah_button_text = document.querySelector(`#post-${post_id} .post-actions .empathy span`);
            const post_empathy_count = document.querySelector(`#post-${post_id} .post-actions span.empathy-count`);

            post_yeah_button.setAttribute("disabled", true);

            try {
                const request = await fetch(`/api/posts/${post_id}/empathy`, { method: "POST" });
                const data = await request.json();

                if (!data.success) {
                    aquamarine.logger.log_error(data.error); return;
                }

                switch (data.empathy_status) {
                    case "CREATED":
                        post_yeah_button_text.innerHTML = post_yeah_button.getAttribute("data-unyeah-text");
                        post_empathy_count.innerHTML = Number(post_empathy_count.innerHTML) + 1;
                        break;
                    case "DELETED":
                        post_yeah_button_text.innerHTML = post_yeah_button.getAttribute("data-yeah-text");
                        post_empathy_count.innerHTML = Number(post_empathy_count.innerHTML) - 1;
                        break;
                }

                aquamarine.events.aquamarine_post_empathy_added.post_id = post_id
                aquamarine.events.aquamarine_post_empathy_added.empathy_status = data.empathy_status
                document.dispatchEvent(aquamarine.events.aquamarine_post_empathy_added)
            } catch (error) {
                aquamarine.logger.log_error(error);
            } finally {
                post_yeah_button.removeAttribute("disabled");
            }
        },

        favorite: async function (community_id) {
            const community_favorite_button = document.querySelector("button.favorite-button");
            community_favorite_button.setAttribute("disabled", true);

            try {
                const request = await fetch(`/api/communities/${community_id}/favorite`, { method: "POST" });
                const data = await request.json();

                if (data.success == false) {
                    switch (favorite_data.error) {
                        case "NULL_COMMUNITY":
                            aquamarine.error.show_error_by_attr("data-null-community-id", () => community_favorite_button.removeAttribute("disabled"))
                            break;
                        default:
                            aquamarine.error.show_error_by_attr("data-default", () => community_favorite_button.removeAttribute("disabled"));
                            break;
                    }
                    return;
                }

                if (data.favorite_status == "CREATED") {
                    community_favorite_button.classList.add("selected");
                } else {
                    community_favorite_button.classList.remove("selected");
                }
            } catch (error) {
                aquamarine.logger.log_error(error)
            } finally {
                community_favorite_button.removeAttribute("disabled");
            }
        },

        last_request_status: 200,
        currently_downloading: false,
        download_posts: async function (selector, query) {
            const post_list = document.querySelector(selector);

            if (!this.can_download(selector)) {
                return;
            }

            this.set_loading_state(true)

            try {
                const posts_request = await fetch(query);

                if (posts_request.status === 200) {
                    const posts_html = await posts_request.text();
                    post_list.innerHTML += posts_html;

                    aquamarine.init.initialize_empathies();
                    aquamarine.init.initialize_href();
                } else {
                    aquamarine.logger.log_info(`No more posts to download! ${posts_request.status}`)
                }

                this.last_request_status = posts_request.status
                this.set_loading_state(false);
            } catch (error) {
                aquamarine.logger.log_error(error)
            }
        },

        can_download: function (selector) {
            const post_list = document.querySelector(selector);
            const loading = document.querySelector(".loading");

            if (this.last_request_status !== 200 || this.currently_downloading || post_list.children.length === 0 || !loading) {
                return false
            } else {
                return true
            }
        },

        set_loading_state: function (t) {
            const loading = document.querySelector(".loading");

            if (t) {
                loading.classList.remove("none")
                this.currently_downloading = true
            } else {
                loading.classList.add("none")
                this.currently_downloading = false
            }
        }
    },
};

document.addEventListener("DOMContentLoaded", () => {
    aquamarine.router.checkRoutes(window.location.pathname);
    aquamarine.init.initialize();

    document.addEventListener("scroll", (ev) => {
        if (
            Math.ceil(window.scrollY + window.innerHeight + 5) >=
            document.body.scrollHeight
        ) {
            document.dispatchEvent(aquamarine.events.aquamarine_scroll_end);
        }
    });
});

aquamarine.router.connect("^/communities/(\\d+)$", (community_id) => {
    const send_button = document.querySelector(".add-new-post button");
    const textarea = document.querySelector("textarea");
    const file_upload = document.querySelector('input[type="file"]');
    var screenshot, screenshot_MIME;

    aquamarine.init.initialize_add_post(function (screenshot, screenshot_MIME) {
        screenshot = screenshot
        screenshot_MIME = screenshot_MIME
    });

    async function make_post() {
        const feeling_id = document.querySelector("input.selected").value;

        const data = {
            body: textarea.value,
            spoiler: 0,
            owns_title: 0,
            community_id: community_id,
            feeling_id: feeling_id,
        };

        if (screenshot) {
            data.screenshot = screenshot;
            data.screenshot_MIME = screenshot_MIME;
        }

        send_button.setAttribute("disabled", true);

        const request = await fetch("/api/posts", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const request_json = await request.json();

        if (request_json.success == true) {
            const post_list = document.querySelector("div.list");
            if (Number(post_list.getAttribute("data-no-posts")) == 1) {
                post_list.innerHTML = "";
                post_list.setAttribute("data-no-posts", 0);
            }

            post_list.innerHTML = request_json.html + post_list.innerHTML;
            aquamarine.initialize_empathies();
            aquamarine.initialize_href();
            post_list.children[0].classList.add("transition");
            textarea.value = "";
            file_upload.value = null;
            screenshot = null;
            screenshot_MIME = null;

            setTimeout(() => {
                post_list.children[0].classList.remove("transition");
            }, 2100);
        }
    }

    if (send_button) {
        send_button.addEventListener("click", make_post);
    }

    aquamarine.init.initialize_empathies();
    aquamarine.init.initialize_favorite_button()

    const post_list = document.querySelector(".list");
    document.addEventListener("aquamarine:scroll_end", async (e) => {
        const offset = post_list.children.length;

        await aquamarine.actions.download_posts(
            ".list",
            `?raw=1&offset=${offset}&limit=25`
        );
    });
});

aquamarine.router.connect("^/search", async () => {
    aquamarine.init.initialize_empathies();

    const post_list = document.querySelector(".list");
    const current_query = new URLSearchParams(window.location.search).get("q");
    document.addEventListener("aquamarine:scroll_end", async (e) => {
        const offset = post_list.children.length;

        await aquamarine.actions.download_posts(
            ".list",
            `?q=${current_query}&raw=1&offset=${offset}&limit=25`
        );
    });
});

aquamarine.router.connect("^/login$", () => {
    const signin = document.querySelector('button[data-role="signin"]');
    const username = document.querySelector('input[name="username"]');
    const password = document.querySelector('input[name="password"]');

    signin.addEventListener("click", (e) => {
        signin.setAttribute("disabled", true);
        aquamarine.account.login();
    });

    [username, password].forEach((e) => {
        e.addEventListener("input", (a) => {
            if (username.value.length > 1 && password.value.length > 1) {
                signin.removeAttribute("disabled");
            } else {
                signin.setAttribute("disabled", true);
            }
        });
    });
    console.log("Initialized Login");
});

aquamarine.router.connect("^/signup$", async () => {
    const main_password_input = document.querySelector(
        'input[name="password"]'
    );
    const confirm_password_input = document.getElementById("confirm");
    const network_id_input = document.querySelector('input[name="username"]');
    const email_input = document.querySelector('input[name="email"]');
    const nickname_input = document.querySelector('input[name="nickname"]');
    const sign_up_button = document.querySelector('input[type="submit"]');
    const form = document.querySelector("form");

    const inputs = [
        main_password_input,
        confirm_password_input,
        network_id_input,
        email_input,
        nickname_input,
    ];

    await inputs.forEach((e) => {
        e.addEventListener("input", (a) => {
            if (
                main_password_input.value.length > 2 &&
                confirm_password_input.value.length > 2 &&
                network_id_input.value.length > 2 &&
                email_input.value.length > 2 &&
                nickname_input.value.length > 2 &&
                confirm_password_input.value == main_password_input.value
            ) {
                sign_up_button.removeAttribute("disabled");
            } else {
                sign_up_button.setAttribute("disabled", true);
            }
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        sign_up_button.setAttribute("disabled", true);
        form.submit();
    });
});

aquamarine.router.connect("^/users/([^/]+)$", async (user_name) => {
    aquamarine.initialize_empathies();
});

aquamarine.router.connect("^/users/(\\S*)/posts$", async (user_name) => {
    aquamarine.initialize_empathies();

    document.addEventListener("aquamarine:scroll_end", async (ev) => {
        const post_list = document.querySelector(".list");
        const offset = post_list.children.length;
        await aquamarine.actions.download_posts(
            ".list",
            `?raw=1&offset=${offset}&limit=25`
        );
    });
});

aquamarine.router.connect("^/users/(\\S*)/empathies$", async (user_name) => {
    aquamarine.initialize_empathies();

    document.addEventListener("aquamarine:scroll_end", async (ev) => {
        const post_list = document.querySelector(".list");
        const offset = post_list.children.length;
        await aquamarine.actions.download_posts(
            ".list",
            `?raw=1&offset=${offset}&limit=25`
        );
    });
});

aquamarine.router.connect("^/posts/([^/]+)$", async (post_id) => {
    const textarea = document.querySelector("textarea");
    const file_upload = document.querySelector('input[type="file"]');
    const send_button = document.querySelector(".add-new-post button");
    var screenshot, screenshot_MIME;

    aquamarine.init.initialize_empathies();
    aquamarine.init.initialize_add_post(function (screenshot_c, screenshot_MIME_c) {
        screenshot = screenshot_c
        screenshot_MIME = screenshot_MIME_c
    });
    document.addEventListener("aquamarine:post_empathy_added", update_empathies_UI);
    if (send_button) { send_button.addEventListener("click", make_reply); }

    async function make_reply() {
        const feeling_id = document.querySelector("input.selected").value;

        const data = {
            body: textarea.value,
            spoiler: 0,
            feeling_id: feeling_id,
        };

        if (screenshot) {
            data.screenshot = screenshot;
            data.screenshot_MIME = screenshot_MIME;
        }

        send_button.setAttribute("disabled", true);

        const request = await fetch(`/api/posts/${document.querySelector("[data-post-id]").getAttribute("data-post-id")}/replies`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const request_data = await request.json();

        if (request_data.success == true) {
            const reply_list = document.querySelector("div.replies.list");
            if (Number(reply_list.getAttribute("data-no-replies")) == 1) {
                reply_list.innerHTML = "";
                reply_list.setAttribute("data-no-replies", 0);
            }

            reply_list.innerHTML = request_data.html + reply_list.innerHTML;
            aquamarine.init.initialize_empathies();
            aquamarine.init.initialize_href();
            reply_list.children[0].classList.add("transition");
            clear_values()

            const reply_count = document.querySelector("span.reply-count")
            reply_count.innerText = Number(reply_count.innerText) + 1

            setTimeout(() => {
                reply_list.children[0].classList.remove("transition");
            }, 2100);
        }

        function clear_values() {
            textarea.value = "";
            file_upload.value = null;
            screenshot = null;
            screenshot_MIME = null;
        }
    }

    function update_empathies_UI(event) {
        const empathy = document.querySelector(`.empathies a[data-self]`);
        const empathies = document.querySelector(".empathies");

        if (!empathy) { return; }

        switch (event.empathy_status) {
            case "CREATED":
                empathy.classList.remove("none");
                break;
            case "DELETED":
                empathy.classList.add("none");
                break;
        }

        if (empathies.querySelectorAll("a:not(.none)").length >= 1) {
            empathies.classList.remove("none")
        } else {
            empathies.classList.add("none")
        }
    }
});

aquamarine.router.connect(/^\/communities\/\d+\/(\w+)$/, async (tab) => {
    if (tab !== "hot") {
        const post_list = document.querySelector(".list");
        document.addEventListener("aquamarine:scroll_end", async (e) => {
            const offset = post_list.children.length;

            await aquamarine.actions.download_posts(
                ".list",
                `?raw=1&offset=${offset}&limit=25`
            );
        });
    }

    aquamarine.init.initialize_empathies();
    aquamarine.init.initialize_favorite_button()
})
