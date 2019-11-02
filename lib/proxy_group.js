const { DrumstickClient } = require("@kkito/drumstick");
class ProxyGroup {
    constructor(sizeOfProxy=8) {
        this.proxies = []
        for(let i = 0 ; i<sizeOfProxy ; i++) {
            this.proxies.push(new ProxyInstance())
        }
    }

    getStatus() {
        return {
            all_size: this.proxies.length,
            active_size: this.proxies.filter(x => x.isRunning).length
        }
    }

    getInstance() {
        const status = this.getStatus()
        console.log(`\t====\t status: ${status.active_size}/${status.all_size}`)
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