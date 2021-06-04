const assert = require('assert/strict');

const {ObjectComposer, ObjectUtils} = require('../index');

describe('ObjectComposer Test', () => {

    it('Test compose()', () => {
        let o1 = {
            id: 123,
            name: 'foo',
            checked: true
        };

        let r1 = ObjectComposer.compose(o1, ['id', 'name']);
        assert(ObjectUtils.objectEquals(r1, {id: 123, name: 'foo'}));
        assert(ObjectUtils.arrayEquals(Object.keys(r1).sort(), ['id', 'name']));

        let r2 = ObjectComposer.compose(o1, ['id', 'addr', 'foo, bar. I\'m']);
        assert(ObjectUtils.arrayEquals(Object.keys(r2).sort(), ['addr', 'foo, bar. I\'m', 'id']));
        assert(r2.addr === undefined);
        assert(r2['foo, bar. I\'m'] === undefined);
    });

    it('Test compose() - deepth', () => {
        let o1 = {
            id: 123,
            name: 'foo',
            addr: { city: 'sz', postcode: '518000' },
            checked: true,
            creationTime: new Date(1)
        };

        let p1 = ObjectComposer.compose(o1, ['id', 'name']);
        let p2 = ObjectComposer.compose(o1, ['id', 'name', 'addr']);
        let p3 = ObjectComposer.compose(o1, ['id', 'checked', 'creationTime']);
        let p4 = ObjectComposer.compose(o1, ['name', 'score']); // 'score' 为一个源对象不存在的属性

        assert(ObjectUtils.objectEquals(p1, {
            id: 123,
            name: 'foo'
        }));

        assert(ObjectUtils.objectEquals(p2, {
            id: 123,
            name: 'foo',
            addr: { city: 'sz', postcode: '518000' },
        }));

        assert(ObjectUtils.objectEquals(p3, {
            id: 123,
            checked: true,
            creationTime: new Date(1)
        }));

        assert(ObjectUtils.objectEquals(p4, {
            name: 'foo',
            score: undefined
        }));
    });

    it('Test splitProperityNameSequence()', ()=>{
        let ns1 = ObjectComposer.splitProperityNameSequence('foo');
        assert(ObjectUtils.arrayEquals(ns1, ['foo']));

        let ns2 = ObjectComposer.splitProperityNameSequence('foo,bar');
        assert(ObjectUtils.arrayEquals(ns2, ['foo', 'bar']));

        let ns3 = ObjectComposer.splitProperityNameSequence('foo,bar,hello');
        assert(ObjectUtils.arrayEquals(ns3, ['foo', 'bar', 'hello']));

        let ns3b = ObjectComposer.splitProperityNameSequence('foo, bar , hello ');
        assert(ObjectUtils.arrayEquals(ns3b, ['foo', 'bar', 'hello']));

        // 带单引号
        let ns4 = ObjectComposer.splitProperityNameSequence('\'foo\'');
        assert(ObjectUtils.arrayEquals(ns4, ['foo']));

        let ns5 = ObjectComposer.splitProperityNameSequence('\'foo\',\'bar"bar\'');
        assert(ObjectUtils.arrayEquals(ns5, ['foo', 'bar"bar']));

        let ns6 = ObjectComposer.splitProperityNameSequence('\'foo\',\'bar"bar\',\'hello# \'\'., world!\'');
        assert(ObjectUtils.arrayEquals(ns6, ['foo', 'bar"bar', 'hello# \'., world!']));

        let ns6b = ObjectComposer.splitProperityNameSequence('\'foo\', \'bar"bar\' , \'hello# \'\'., world!\'');
        assert(ObjectUtils.arrayEquals(ns6b, ['foo', 'bar"bar', 'hello# \'., world!']));

        // 双引号
        let ns7 = ObjectComposer.splitProperityNameSequence('"foo"');
        assert(ObjectUtils.arrayEquals(ns7, ['foo']));

        let ns8 = ObjectComposer.splitProperityNameSequence('"foo","bar\'bar"');
        assert(ObjectUtils.arrayEquals(ns8, ['foo', 'bar\'bar']));

        let ns9 = ObjectComposer.splitProperityNameSequence('"foo","bar\'bar","hello# \'., world!"');
        assert(ObjectUtils.arrayEquals(ns9, ['foo', 'bar\'bar', 'hello# \'., world!']));

        let ns9b = ObjectComposer.splitProperityNameSequence('"foo", "bar\'bar" , "hello# \'., world!"');
        assert(ObjectUtils.arrayEquals(ns9b, ['foo', 'bar\'bar', 'hello# \'., world!']));
    });

    it('Test composeByProperityNameSequence()', () => {
        let o1 = {
            id: 123,
            name: 'foo',
            checked: true
        };

        let r1 = ObjectComposer.composeByProperityNameSequence(o1, 'id, name');
        assert(ObjectUtils.objectEquals(r1, {id: 123, name: 'foo'}));
        assert(ObjectUtils.arrayEquals(Object.keys(r1).sort(), ['id', 'name']));

        let r2 = ObjectComposer.composeByProperityNameSequence(o1, 'id, addr, \'foo, bar. I\'\'m\'');
        assert(ObjectUtils.arrayEquals(Object.keys(r2).sort(), ['addr', 'foo, bar. I\'m', 'id']));
        assert(r2.addr === undefined);
        assert(r2['foo, bar. I\'m'] === undefined);
    });

});