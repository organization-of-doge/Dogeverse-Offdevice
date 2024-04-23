const jwt = require("jsonwebtoken")
const moment = require("moment")

function generate_auth_token(account) {
    const user_data = {
        account_id : account.id,
        account_nnid : account.nnid,
        iat : new Date().valueOf(),
        iss : "aquamarine.lol",
    }

    const secret = JSON.parse(process.env.ENVIRONMENT)["AUTH_TOKEN_SECRET"]

    const options = { expiresIn : "2d"}

    return jwt.sign(user_data, secret, options)
}

function verify_auth_token(token) {
    const secret = JSON.parse(process.env.ENVIRONMENT)['AUTH_TOKEN_SECRET']

    try {
        const decoded_data = jwt.verify(token, secret)

        return {success : true, data : decoded_data}
    } catch (error) {
        console.error(error)

        return {success : false, error : error}
    }
}

module.exports = {
    generate_auth_token,
    verify_auth_token
}