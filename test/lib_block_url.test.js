const assert = require('assert');
const { BlockUrl } = require('../lib/block_url')

describe('lib BlockUrl', () => {
    it('parseListFile', () => {
        const result = BlockUrl.parseListFile()
        assert.equal(true , result.size > 100)
    })

    it('checkHostBlock', () => {
        let result = BlockUrl.checkHostBlocked('baidu.com')
        assert.equal(false , result)
        result = BlockUrl.checkHostBlocked('www.baidu.com')
        assert.equal(false , result)

        result = BlockUrl.checkHostBlocked('mail.163.com')
        assert.equal(false , result)

        result = BlockUrl.checkHostBlocked('mail.gmail.com')
        assert.equal(true, result)

    })
})
