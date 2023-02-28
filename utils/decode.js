
const Base64 = require('js-base64').Base64;

function decode(data) {
    return JSON.parse(Base64.decode(data))
}

export default {
    decode
}