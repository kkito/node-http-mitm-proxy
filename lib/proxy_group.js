const { DrumstickClient } = require("@kkito/drumstick");
class ProxyGroup {
    constructor(sizeOfProxy=15) {
        this.proxies = []
        for(let i = 0 ; i<sizeOfProxy ; i++) {
            this.proxies.push(new ProxyInstance())
        }
    }

    getInstance() {
        return this.proxies.find((x) => {
            return !x.isRunning
        })
    }
}

class ProxyInstance {

    constructor() {
        this.client = new DrumstickClient({ host: process.env.DC_HOST, port: process.env.DC_PORT }, process.env.DC_KEY);
        this.isRunning = false
    }

    async request(url, method, headers, body) {
        this.isRunning = true
        const result = await this.client.ensureRequestV2(
            url,method,headers,body, {}
        )
        this.isRunning = false
        return result
    }

    close() {
        this.client.close()
        this.isRunning = false
    }
}
module.exports = {ProxyGroup, ProxyInstance}