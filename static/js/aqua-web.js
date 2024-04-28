const aquamarine = {
    initialize: function () {
        const path = window.location.pathname;

        switch (path) {
            case "/login":
                document.querySelector('button[data-role="signin"]').addEventListener("click", aquamarine.login)
                console.log("Login")
                break;

            default:
                console.log("Nothing to initalize!")
                break;
        }

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

        document.querySelector("#settings-logout").addEventListener("click", () => {
            aquamarine.logout();
        })

        document.querySelector("#settings-button").addEventListener("click", () => {
            document.querySelector(".settings-menu").classList.toggle("none")
        })
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

    actions : {
        empathy : async function (post_id) {
            console.log(post_id)
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    aquamarine.initialize()
})