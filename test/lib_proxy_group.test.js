const util = require('util');
const assert = require('assert');
const { ProxyGroup } = require('../lib/proxy_group')

describe('create proxy group', () => {
    it('should status valid', () => {
        const group = new ProxyGroup()
        const result = group.getStatus()
        assert.equal(8, result.all_size)
        assert.equal(0, result.active_size)
    })
})