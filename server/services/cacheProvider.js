let NodeCache = require('node-cache');
let cache = null;

module.exports.start = function (done) {
    if (cache) return done();

    cache = new NodeCache({
        stdTTL: 600,
        // when false this means that the cache object returned is a reference not a clone
        useClones: false,
        maxKeys: 10
    });
}

module.exports.instance = function () {
    return cache;
}