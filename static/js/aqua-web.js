const aquamarine = {
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

    initialize: function () {
        document.querySelectorAll("[data-href]").forEach((e) => {
            e.addEventListener("click", () => {
                window.location.href = e.getAttribute("data-href");
            });
        });

        const logout = document.querySelector("#settings-logout");
        const settings = document.querySelector("#settings-button");

        if (logout) {
            logout.addEventListener("click", () => {
                aquamarine.logout();
            });
        }
        if (settings) {
            settings.addEventListener("click", () => {
                document
                    .querySelector(".settings-menu")
                    .classList.toggle("none");
            });
        }
    },

    initialize_empathies: function () {
        document.querySelectorAll(".empathy:not(.disabled)").forEach((e) => {
            e.addEventListener("click", (event) => {
                event.stopPropagation();
                aquamarine.actions.empathy(e.getAttribute("data-post-id"));
            });
        });
    },

    login: async function () {
        const username = document.querySelector('input[name="username"]').value;
        const password = document.querySelector('input[name="password"]').value;
        const error_text = document.querySelector("span.error-text");
        const signin = document.querySelector('button[data-role="signin"]');

        if (!username || !password) {
            return;
        }

        const token_data = await fetch("/api/oauth/retrieve_token", {
            method: "POST",
            headers: {
                "auth-password": password,
                "auth-network-id": username,
            },
        });

        const token = await token_data.json();

        if (token.success == false) {
            error_text.classList.remove("none");
            error_text.classList.add("transition");
            signin.setAttribute("disabled", true);
            switch (token.error) {
                case "NO_ACCOUNT_FOUND":
                    error_text.innerHTML =
                        error_text.getAttribute("data-no-account");
                    break;
                case "PASSWORD_MISMATCH":
                    error_text.innerHTML = error_text.getAttribute(
                        "data-password-mismatch"
                    );
                    break;
                default:
                    error_text.innerHTML =
                        error_text.getAttribute("data-default");
                    break;
            }

            setTimeout(() => {
                error_text.classList.remove("transition");
                signin.removeAttribute("disabled");
            }, 2100);
            return;
        }

        if (document.querySelector('input[type="checkbox"]').checked) {
            var date = new Date();
            date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);

            document.cookie = `jwt=${
                token.token
            }; Path=/; Secure; SameSite=None; expires=${date.toUTCString()};`;
        } else {
            document.cookie = `jwt=${token.token}; Path=/; Secure; SameSite=None`;
        }

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
        console.log("Logging out of current account.");

        var currentURL = window.location.href;

        document.cookie =
            "jwt=; Path=/; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        setTimeout(() => {
            window.location.href = currentURL;
        }, 100);
    },

    actions: {
        empathy: async function (post_id) {
            const post_yeah_button = document.querySelector(
                `#post-${post_id} .post-content-wrapper .post-actions .empathy`
            );
            const post_yeah_button_text = document.querySelector(
                `#post-${post_id} .post-content-wrapper .post-actions .empathy span`
            );
            const post_empathy_count = document.querySelector(
                `#post-${post_id} .post-content-wrapper .post-actions span.empathy-count`
            );

            post_yeah_button.setAttribute("disabled", true);

            const empathy_request = await fetch(
                `/api/posts/${post_id}/empathy`,
                {
                    method: "POST",
                }
            );

            const empathy_data = await empathy_request.json();

            if (empathy_data.success == false) {
                console.log(empathy_data.error);

                return;
            }

            switch (empathy_data.empathy_status) {
                case "CREATED":
                    post_yeah_button_text.innerHTML =
                        post_yeah_button.getAttribute("data-unyeah-text");
                    post_empathy_count.innerHTML =
                        Number(post_empathy_count.innerHTML) + 1;
                    break;
                case "DELETED":
                    post_yeah_button_text.innerHTML =
                        post_yeah_button.getAttribute("data-yeah-text");
                    post_empathy_count.innerHTML =
                        Number(post_empathy_count.innerHTML) - 1;
                    break;
            }

            post_yeah_button.removeAttribute("disabled");
        },

        favorite: async function (community_id) {
            const community_favorite_button = document.querySelector(
                "button.favorite-button"
            );
            const error_text = document.querySelector(
                ".community-actions span.error-text"
            );

            community_favorite_button.setAttribute("disabled", true);

            const favorite_request = await fetch(
                `/api/communities/${community_id}/favorite`,
                {
                    method: "POST",
                }
            );

            const favorite_data = await favorite_request.json();

            if (favorite_data.success == false) {
                error_text.classList.remove("none");
                error_text.classList.add("transition");

                switch (favorite_data.error) {
                    case "NULL_COMMUNITY":
                        error_text.innerHTML = error_text.getAttribute(
                            "data-null-community-id"
                        );
                        break;
                    default:
                        error_text.innerHTML =
                            error_text.getAttribute("data-default");
                        break;
                }

                setTimeout(() => {
                    error_text.classList.remove("transition");
                    community_favorite_button.removeAttribute("disabled");
                }, 2100);
                return;
            }

            if (favorite_data.favorite_status == "CREATED") {
                community_favorite_button.classList.add("selected");
            } else {
                community_favorite_button.classList.remove("selected");
            }

            error_text.classList.add("none");
            community_favorite_button.removeAttribute("disabled");
        },
    },
};

document.addEventListener("DOMContentLoaded", () => {
    aquamarine.router.checkRoutes(window.location.pathname);
    aquamarine.initialize();
});

aquamarine.router.connect("^/communities/(\\d+)$", (community_id) => {
    const feeling_inputs = document.querySelectorAll(".feeling-selector input");
    const send_button = document.querySelector(".add-new-post button");
    const textarea = document.querySelector("textarea");
    const file_upload = document.querySelector('input[type="file"]');
    var screenshot, screenshot_MIME;

    document.querySelectorAll("[data-expand]").forEach((e) => {
        e.addEventListener("click", open_expandable);
    });

    function open_expandable(e) {
        document
            .querySelectorAll(e.target.getAttribute("data-expand"))
            .forEach((e) => {
                e.classList.remove("none");
            });
    }

    console.log("Initializing feeling selector");

    feeling_inputs.forEach((e) => {
        e.addEventListener("click", (event) => {
            feeling_inputs.forEach((feeling) => {
                feeling.classList.remove("selected");
            });

            event.target.classList.add("selected");
        });
    });

    console.log("Initializing textarea");

    textarea.addEventListener("input", (e) => {
        if (e.target.value.replace(/\s/g, "").length <= 0) {
            send_button.setAttribute("disabled", "true");
        } else {
            send_button.removeAttribute("disabled");
        }
    });

    console.log("Initializing file upload");

    file_upload.addEventListener("change", (file) => {
        send_button.setAttribute("disabled", "true");
        var input = file.target;
        const reader = new FileReader();

        reader.readAsDataURL(input.files[0]);

        reader.onload = () => {
            screenshot = reader.result.split(",")[1];
            screenshot_MIME = input.files[0].type;
            send_button.removeAttribute("disabled");
        };
    });

    console.log("Initializing post button");

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

    send_button.addEventListener("click", make_post);

    console.log("Initializing empathies");
    aquamarine.initialize_empathies();

    console.log("Initializing favorites");
    document
        .querySelector("button.favorite-button")
        .addEventListener("click", (e) => {
            aquamarine.actions.favorite(
                document
                    .querySelector("button.favorite-button")
                    .getAttribute("data-community-id")
            );
        });
});

aquamarine.router.connect("^/search", async () => {
    aquamarine.initialize_empathies();

    var last_request_status = 200;
    var currently_downloading;

    const post_list = document.querySelector(".list");
    const loading = document.querySelector(".loading");
    document.addEventListener("scroll", async (e) => {
        if (
            last_request_status !== 200 ||
            currently_downloading ||
            !(
                Math.round(window.scrollY + window.innerHeight) >=
                document.body.scrollHeight
            )
        ) {
            return;
        }

        currently_downloading = true;
        loading.classList.remove("none");

        const offset = post_list.children.length;
        const current_query = new URLSearchParams(window.location.search).get(
            "q"
        );

        const posts_request = await fetch(
            `?q=${current_query}&raw=1&offset=${offset}&limit=8`
        );

        const posts_html = await posts_request.text();

        post_list.innerHTML += posts_html;
        last_request_status = posts_request.status;
        currently_downloading = false;
        loading.classList.add("none");
    });
});

aquamarine.router.connect("^/login$", () => {
    const signin = document.querySelector('button[data-role="signin"]');
    const username = document.querySelector('input[name="username"]');
    const password = document.querySelector('input[name="password"]');

    signin.addEventListener("click", (e) => {
        signin.setAttribute("disabled", true);
        aquamarine.login();
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
    const sign_up_button = document.querySelector('input[type="submit"]');
    const form = document.querySelector("form");

    const inputs = [
        main_password_input,
        confirm_password_input,
        network_id_input,
        email_input,
    ];

    await inputs.forEach((e) => {
        e.addEventListener("input", (a) => {
            if (
                main_password_input.value.length > 2 &&
                confirm_password_input.value.length > 2 &&
                network_id_input.value.length > 2 &&
                email_input.value.length > 2 &&
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
