class ReplyCache {
    constructor() {
        this.cache = {};
    }

    setCache(topic, payload){
        this.cache[topic] = payload
    }

    hasData(topic){
        if (this.cache[topic]){
            console.log("Message type exists: " + topic)
            return true
        }
        console.log("Message type does not exist: " + topic)
        return false
    }

    getCachedData(topic){
        var ret = this.cache[topic]
        return ret
    }
}
module.exports = new ReplyCache();