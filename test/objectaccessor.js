const assert = require('assert/strict');

const { ObjectAccessor, ObjectUtils } = require('../index');

describe('ObjectAccessor Test', () => {
    it('Test getPropertyValueByNamePath()', () => {
        let a = {
            id: 123,
            addr: {
                city: 'abc',
                street: 'xyz'
            },
            name: 'foobar'
        };

        assert.equal(ObjectAccessor.getPropertyValueByNamePath(a, 'id'), 123);
        assert.equal(ObjectAccessor.getPropertyValueByNamePath(a, 'name'), 'foobar');
        assert.equal(ObjectAccessor.getPropertyValueByNamePath(a, 'addr.city'), 'abc');
        assert.equal(ObjectAccessor.getPropertyValueByNamePath(a, 'addr.street'), 'xyz');

        assert(ObjectAccessor.getPropertyValueByNamePath(a, 'no') === undefined);
        assert(ObjectAccessor.getPropertyValueByNamePath(a, 'no.way') === undefined);
    });

    it('Test splitNamePath()', () => {
        let ns1 = ObjectAccessor.splitNamePath('foo');
        assert(ObjectUtils.arrayEquals(ns1, ['foo']));

        let ns2 = ObjectAccessor.splitNamePath('foo.bar');
        assert(ObjectUtils.arrayEquals(ns2, ['foo', 'bar']));

        let ns3 = ObjectAccessor.splitNamePath('foo.bar.hello');
        assert(ObjectUtils.arrayEquals(ns3, ['foo', 'bar', 'hello']));

        // 带单引号
        let ns4 = ObjectAccessor.splitNamePath('\'foo\'');
        assert(ObjectUtils.arrayEquals(ns4, ['foo']));

        let ns5 = ObjectAccessor.splitNamePath('\'foo\'.\'bar"bar\'');
        assert(ObjectUtils.arrayEquals(ns5, ['foo', 'bar"bar']));

        let ns6 = ObjectAccessor.splitNamePath('\'foo\'.\'bar"bar\'.\'hello# \'\'., world!\'');
        assert(ObjectUtils.arrayEquals(ns6, ['foo', 'bar"bar', 'hello# \'., world!']));

        // 双引号
        let ns7 = ObjectAccessor.splitNamePath('"foo"');
        assert(ObjectUtils.arrayEquals(ns7, ['foo']));

        let ns8 = ObjectAccessor.splitNamePath('"foo"."bar\'bar"');
        assert(ObjectUtils.arrayEquals(ns8, ['foo', 'bar\'bar']));

        let ns9 = ObjectAccessor.splitNamePath('"foo"."bar\'bar"."hello# \'., world!"');
        assert(ObjectUtils.arrayEquals(ns9, ['foo', 'bar\'bar', 'hello# \'., world!']));
    });
});