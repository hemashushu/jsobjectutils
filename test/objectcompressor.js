const assert = require('assert/strict');

const { ObjectCompressor, ObjectUtils } = require('../index');

describe('ObjectCompressor Test', () => {

    it('Test1', () => {
        let obj1 = {
            id: 123,
            name: 'yang'
        };

        let t1 = ['id', 'name'];

        let c1 = ObjectCompressor.compress(obj1, t1);
        assert(ObjectUtils.arrayEquals(c1, [123, 'yang']));

        let d1 = ObjectCompressor.decompress(c1, t1);
        assert(ObjectUtils.objectEquals(d1, obj1));
    });

    it('Test2', () => {
        let obj1 = {
            id: 123,
            name: 'yang',
            tags: ['foo', 'bar']
        };

        let t1 = ['id', 'name', 'tags'];

        let c1 = ObjectCompressor.compress(obj1, t1);
        assert(ObjectUtils.arrayEquals(c1, [123, 'yang', ['foo', 'bar']]));

        let d1 = ObjectCompressor.decompress(c1, t1);
        assert(ObjectUtils.objectEquals(d1, obj1));
    });

    it('Test3', () => {
        let obj1 = {
            id: 123,
            name: 'yang',
            tags: ['foo', 'bar']
        };

        let t1 = ['id', 'name', 'addr', 'tags'];

        let c1 = ObjectCompressor.compress(obj1, t1);
        assert(ObjectUtils.arrayEquals(c1, [123, 'yang', undefined, ['foo', 'bar']]));

        let d1 = ObjectCompressor.decompress(c1, t1);

        let obj2 = {
            id: 123,
            name: 'yang',
            addr: undefined,
            tags: ['foo', 'bar']
        };
        assert(ObjectUtils.objectEquals(d1, obj2));
    });

    it('Test4', () => {
        let obj1 = {
            id: 123,
            name: 'yang',
            addr: {
                street: '1st Rd',
                city: 'Shenzhen'
            }
        };

        let t1 = ['id', 'name', { name: 'addr', keys: ['street', 'city'] }];

        let c1 = ObjectCompressor.compress(obj1, t1);
        assert(ObjectUtils.arrayEquals(c1, [123, 'yang', ['1st Rd', 'Shenzhen']]));

        let d1 = ObjectCompressor.decompress(c1, t1);
        assert(ObjectUtils.objectEquals(d1, obj1));
    });

    it('Test5', () => {
        let obj1 = {
            id: 123,
            name: 'yang',
            addr: [{
                street: '1st Rd',
                city: 'Shenzhen'
            }, {
                street: '2st Rd',
                city: 'Guangzhou'
            }]
        };

        let t1 = ['id', 'name', {
            name: 'addr',
            type: 'array',
            keys: ['street', 'city']
        }];

        let c1 = ObjectCompressor.compress(obj1, t1);

        assert(ObjectUtils.arrayEquals(c1, [123, 'yang', [
            ['1st Rd', 'Shenzhen'],
            ['2st Rd', 'Guangzhou']
        ]
        ]));

        let d1 = ObjectCompressor.decompress(c1, t1);
        assert(ObjectUtils.objectEquals(d1, obj1));
    });

});
