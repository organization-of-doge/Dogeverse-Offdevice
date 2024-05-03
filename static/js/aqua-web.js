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
        }
    },

    initialize: function () {
        document.querySelectorAll("[data-href]").forEach((e) => {
            e.addEventListener("click", () => {
                window.location.href = e.getAttribute("data-href")
            })
        })

        const logout = document.querySelector("#settings-logout")
        const settings = document.querySelector("#settings-button")

        if (logout) {
            logout.addEventListener("click", () => {
                aquamarine.logout();
            })
        }
        if (settings) {
            settings.addEventListener("click", () => {
                document.querySelector(".settings-menu").classList.toggle("none")
            })
        }
    },

    initialize_empathies: function () {
        document.querySelectorAll(".empathy:not(.disabled)").forEach((e) => {
            e.addEventListener("click", (event) => {
                event.stopPropagation()
                aquamarine.actions.empathy(e.getAttribute("data-post-id"))
            })
        })
    },

    login: async function () {
        const username = document.querySelector('input[name="username"]').value
        const password = document.querySelector('input[name="password"]').value
        const error_text = document.querySelector("span.error-text")
        const signin = document.querySelector('button[data-role="signin"]');

        if (!username || !password) { return; }

        const token_data = await fetch("/api/oauth/retrieve_token", {
            "method": "POST",
            "headers": {
                "auth-password": password,
                "auth-network-id": username
            }
        })

        const token = (await token_data.json())

        if (token.success == false) {
            error_text.classList.remove("none")
            error_text.classList.add("transition")
            signin.classList.add("disabled")
            signin.setAttribute("disabled", true)
            switch (token.error) {
                case "NO_ACCOUNT_FOUND":
                    error_text.innerHTML = error_text.getAttribute("data-no-account")
                    break;
                case "PASSWORD_MISMATCH":
                    error_text.innerHTML = error_text.getAttribute("data-password-mismatch")
                    break;
                default:
                    error_text.innerHTML = error_text.getAttribute("data-default")
                    break;
            }

            setTimeout(() => {
                error_text.classList.remove("transition")
                signin.classList.remove("disabled")
                signin.removeAttribute("disabled")
            }, 2100)
            return;
        }

        if (document.querySelector('input[type="checkbox"]').checked) {
            var date = new Date();
            date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
            console.log(date.getUTCDate())

            document.cookie = `jwt=${token.token}; Path=/; Secure; SameSite=None; expires=${date.toUTCString()};`
        } else {
            document.cookie = `jwt=${token.token}; Path=/; Secure; SameSite=None`
        }

        const redirect = (new URLSearchParams(window.location.search)).get("redirect")

        if (redirect) { window.location.href = redirect } else { window.location.href = "/" }
    },

    logout: function () {
        console.log("Logging out of current account.");

        var currentURL = window.location.href;

        document.cookie = "jwt=; Path=/; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        setTimeout(() => {
            window.location.href = currentURL;
        }, 100);
    },

    actions: {
        empathy: async function (post_id) {
            const post_yeah_button = document.querySelector(`#post-${post_id} .post-content-wrapper .post-actions .empathy`)
            const post_yeah_button_text = document.querySelector(`#post-${post_id} .post-content-wrapper .post-actions .empathy span`)
            const post_empathy_count = document.querySelector(`#post-${post_id} .post-content-wrapper .post-actions span.empathy-count`)

            post_yeah_button.setAttribute("disabled", true)
            post_yeah_button.classList.add("disabled")

            const empathy_request = await fetch(`/api/posts/${post_id}/empathy`, {
                method: "POST"
            })

            const empathy_data = await empathy_request.json()

            if (empathy_data.success == false) {
                console.log(empathy_data.error)

                return;
            }

            switch (empathy_data.empathy_status) {
                case "CREATED":
                    post_yeah_button_text.innerHTML = post_yeah_button.getAttribute("data-unyeah-text")
                    post_empathy_count.innerHTML = Number(post_empathy_count.innerHTML) + 1
                    break;
                case "DELETED":
                    post_yeah_button_text.innerHTML = post_yeah_button.getAttribute("data-yeah-text")
                    post_empathy_count.innerHTML = Number(post_empathy_count.innerHTML) - 1
                    break;
            }

            post_yeah_button.removeAttribute("disabled")
            post_yeah_button.classList.remove("disabled")
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    aquamarine.router.checkRoutes(window.location.pathname)
    aquamarine.initialize()
})

aquamarine.router.connect("^/communities/(\\d+)$", (community_id) => {
    const feeling_inputs = document.querySelectorAll(".feeling-selector input")
    const send_button = document.querySelector(".add-new-post button")
    const textarea = document.querySelector("textarea")
    const file_upload = document.querySelector('input[type="file"]')
    var screenshot, screenshot_MIME

    document.querySelectorAll("[data-expand]").forEach((e) => {
        e.addEventListener("click", open_expandable)
    })

    function open_expandable(e) {
        document.querySelectorAll(e.target.getAttribute("data-expand")).forEach((e) => {
            e.classList.remove("none")
        })
    }

    console.log("Initializing feeling selector")

    feeling_inputs.forEach((e) => {
        e.addEventListener("click", (event) => {
            feeling_inputs.forEach((feeling) => {
                feeling.classList.remove("selected")
            })

            event.target.classList.add("selected")
        })
    })

    console.log("Initializing textarea")

    textarea.addEventListener("input", (e) => {
        if (e.target.value.replace(/\s/g, "").length <= 0) {
            send_button.setAttribute("disabled", "true")
        } else {
            send_button.removeAttribute("disabled")
        }
    })

    console.log("Initializing file upload")

    file_upload.addEventListener("change", (file) => {
        send_button.setAttribute("disabled", "true")
        var input = file.target
        const reader = new FileReader()

        reader.readAsDataURL(input.files[0])

        reader.onload = () => {
            screenshot = (reader.result.split(","))[1]
            screenshot_MIME = input.files[0].type
            send_button.removeAttribute("disabled")
        }
    })

    console.log("Initializing post button")

    async function make_post() {
        const feeling_id = document.querySelector("input.selected").value

        const data = {
            body: textarea.value,
            spoiler: 0,
            owns_title: 0,
            community_id: community_id,
            feeling_id: feeling_id
        }

        if (screenshot) { data.screenshot = screenshot; data.screenshot_MIME = screenshot_MIME }

        const request = await fetch("/api/posts", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        })

        const request_json = await request.json()

        if (request_json.success == true) {
            const post_list = document.querySelector("div.list")
            if (Number(post_list.getAttribute("data-no-posts")) == 1) {
                post_list.innerHTML = ""
                post_list.setAttribute("data-no-posts", 0)
            }

            post_list.innerHTML = request_json.html + post_list.innerHTML
            post_list.children[0].classList.add("transition")
            textarea.value = "";
            file_upload.value = null;
            screenshot = null;
            screenshot_MIME = null;

            setTimeout(() => {
                post_list.children[0].classList.remove("transition")
            }, 2100)
        }
    }

    send_button.addEventListener("click", make_post)

    console.log("Initialzing empathies")
    aquamarine.initialize_empathies()
})

aquamarine.router.connect("^/login$", () => {
    const signin = document.querySelector('button[data-role="signin"]')
    signin.addEventListener("click", aquamarine.login);

    const inputs = [document.querySelector('input[name="username"]'), document.querySelector('input[name="password"]')]
    inputs.forEach((e) => {
        e.addEventListener("input", (a) => {
            console.log(a.value)

            if (inputs[0].value.length > 1 && inputs[1].value.length > 1) {
                signin.classList.remove("disabled")
                signin.removeAttribute("disabled")
            } else {
                signin.classList.add("disabled")
                signin.setAttribute("disabled", true)
            }
        })
    })
    console.log("Initialized Login");
});

aquamarine.router.connect("^/signup$", () => {
    const main_password_input = document.querySelector('input[name="password"]');
    const confirm_password_input = document.getElementById("confirm");
    const sign_up_button = document.querySelector('input[type="submit"]');

    [main_password_input, confirm_password_input].forEach((e) => {
        e.addEventListener("input", (a) => {
            if (main_password_input.value === confirm_password_input.value) {
                sign_up_button.removeAttribute("disabled")
                sign_up_button.classList.remove("disabled")
            } else {
                sign_up_button.setAttribute("disabled", true)
                sign_up_button.classList.add("disabled")
            }
        })
    })
})