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
        nav_bar_initialize()

        document.querySelectorAll("[data-href]").forEach((e) => {
            e.addEventListener("click", () => {
                window.location.href = e.getAttribute("data-href")
            })
        })

        document.querySelectorAll(".empathy:not(.disabled)").forEach((e) => {
            e.addEventListener("click", (event) => {
                event.stopPropagation()
                aquamarine.actions.empathy(e.getAttribute("data-post-id"))
            })
        })

        function nav_bar_initialize() {
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
        }
    },

    login: async function () {
        const username = document.querySelector('input[name="username"]').value
        const password = document.querySelector('input[name="password"]').value

        if (!username || !password) { return; }

        const token_data = await fetch("/api/oauth/retrieve_token", {
            "method": "POST",
            "headers": {
                "auth-password": password,
                "auth-network-id": username
            }
        })

        const token = (await token_data.json())

        if (token.success == false) { window.location.reload(); return; }

        document.cookie = `jwt=${token.token}; Path=/; Secure; SameSite=None`

        window.location.href = "/"
    },

    logout: function () {
        console.log("Logging out of current account.")
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
        window.location.href = "/"
    },

    actions: {
        empathy: async function (post_id) {
            console.log(post_id)
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
    var screenshot

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
        var input = file.target
        const reader = new FileReader()

        reader.readAsDataURL(input.files[0])

        reader.onload = (ev) => {
            screenshot = ev.explicitOriginalTarget.result.replace("data:image/jpeg;base64,", "")
        }
    })

    console.log("Initializing post button")

    async function make_post() {
        const feeling_id = document.querySelector("input.selected").value

        const data = {
            body : textarea.value,
            spoiler : 0,
            owns_title : 0,
            community_id : community_id,
            feeling_id : feeling_id
        }

        if (screenshot) {data.screenshot = screenshot}

        const request = await fetch("/api/posts", {
            method : "POST",
            body : JSON.stringify(data),
            headers : {
                "Content-Type" : "application/json"
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

            setTimeout(() => {
                post_list.children[0].classList.remove("transition")
            }, 2100)
        }
    }

    send_button.addEventListener("click", make_post)
})

aquamarine.router.connect("^/login$", () => {
    document.querySelector('button[data-role="signin"]').addEventListener("click", aquamarine.login);
    console.log("Initialized Login");
});