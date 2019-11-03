const fs = require('fs')

let blockDomains = null

class BlockUrl {
    // check if the given url is blocked
    // the list is from  `https://github.com/gfwlist/tinylist/blob/master/tinylist.txt`

    static getBlockDomains() {
        if (!blockDomains) {
            blockDomains = this.parseListFile()
        }
        return blockDomains
    }

    static parseListFile() {
        const result = new Set()
        const content = fs.readFileSync('./lib/tinylist.txt').toString()
        const buf = Buffer.from(content, 'base64')
        buf.toString().split('\n').forEach(line => {
            if (line.startsWith('!') || 
            line.startsWith('[') || 
            line.startsWith('@')) {
                return 
            }
            if (line.length < 2) {
                return
            }
            line = line.replace('||' , '')
            line = line.replace('|' , '')
            // console.log(line)
            result.add(line)
        })
        return result
    }

    static checkHostBlocked(hostName) {
        const parts = hostName.split('.')
        const size = parts.length
        let checkStr = hostName
        if(size > 2) {
            checkStr = `${parts[size-2]}.${parts[size-1]}`
        }
        const domains = this.getBlockDomains()
        // console.log(checkStr)
        return domains.has(checkStr)
    }

}
module.exports = { BlockUrl }