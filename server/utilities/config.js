const base64ToAscii = (text) => Buffer.from(text, 'base64').toString('ascii');
const asciiTobase64 = (text) => Buffer.from(text).toString('base64');
const config = require('../config/' + process.env.Environment + '_config.json');
// transformConfig(config)

// function getConfig() {
//     if (config === undefined) {
//         config = require("../config/" + process.env.Environment + "_config.json")
//         transformConfig(config)
//     }
//     return config
// }

/**
 * Transform config object from string to b64 and vice versa
 * @param {object} obj config object
 * @param {boolean} decode true if source is plain text
 */
function transformConfig(obj, decode = false) {
    for (let i in obj) {
        if (typeof obj[i] === 'object') {
            transformConfig(obj[i], decode);
        } else {
            obj[i] = (decode) ? asciiTobase64(obj[i]) : base64ToAscii(obj[i]);
        }
    }
}

module.exports = {
    config
};
