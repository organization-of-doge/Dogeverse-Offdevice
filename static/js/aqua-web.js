document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-href]").forEach((e) => {
        e.addEventListener("click", () => {
            window.location.href = e.getAttribute("data-href")
        })
    })
})

async function login() {
    const username = document.querySelector('input[name="username"]').value
    const password = document.querySelector('input[name="password"]').value

    const token_data = await fetch("/api/oauth/retrieve_token", {
        "method" : "POST",
        "headers" : {
            "auth-password" : password,
            "auth-network-id" : username
        }
    })

    const token = (await token_data.json())

    if (token.success == false) {window.location.reload(); return;}

    document.cookie = `jwt=${token.token}; Path=/; Secure; SameSite=Strict` 

    window.location.href = "/"
}