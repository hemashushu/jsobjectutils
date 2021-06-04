const assert = require('assert/strict');

const { ObjectSorter, ObjectUtils, OrderField } = require('../index');

describe('ObjectSorter Test', () => {

    it('Test parseOrderExpression()', () => {
        let ns1 = ObjectSorter.parseOrderExpression('foo');
        assert(ObjectUtils.arrayEquals(ns1, [
            new OrderField('foo')
        ]));

        let ns2 = ObjectSorter.parseOrderExpression('foo,bar');
        assert(ObjectUtils.arrayEquals(ns2, [
            new OrderField('foo'),
            new OrderField('bar')
        ]));

        let ns3 = ObjectSorter.parseOrderExpression('foo, bar DESC, hello');
        assert(ObjectUtils.arrayEquals(ns3, [
            new OrderField('foo'),
            new OrderField('bar', false),
            new OrderField('hello')
        ]));

        // 带单引号
        let ns4 = ObjectSorter.parseOrderExpression('\'foo\'');
        assert(ObjectUtils.arrayEquals(ns4, [
            new OrderField('foo')
        ]));

        let ns5 = ObjectSorter.parseOrderExpression('\'foo\' DESC,\'bar"bar\'');
        assert(ObjectUtils.arrayEquals(ns5, [
            new OrderField('foo', false),
            new OrderField('bar"bar')
        ]));

        let ns6 = ObjectSorter.parseOrderExpression('\'foo\',\'bar"bar\',\'hello# \'\'., world!\'');
        assert(ObjectUtils.arrayEquals(ns6, [
            new OrderField('foo'),
            new OrderField('bar"bar'),
            new OrderField('hello# \'., world!')
        ]));

        // 双引号
        let ns7 = ObjectSorter.parseOrderExpression('"foo"');
        assert(ObjectUtils.arrayEquals(ns7, [
            new OrderField('foo')
        ]));

        let ns8 = ObjectSorter.parseOrderExpression('"foo" desc,"bar\'bar" desc');
        assert(ObjectUtils.arrayEquals(ns8, [
            new OrderField('foo', false),
            new OrderField('bar\'bar', false)
        ]));

        let ns9 = ObjectSorter.parseOrderExpression('"foo","bar\'bar","hello# \'., world!"');
        assert(ObjectUtils.arrayEquals(ns9, [
            new OrderField('foo'),
            new OrderField('bar\'bar'),
            new OrderField('hello# \'., world!')
        ]));
    });

    let createItemObjects = ()=>{
        let itemObjects = [
            {id:5, type: 'foo', checked:false, sub: {name: 'e'} },
            {id:2, type: 'foo', checked:true, sub: {name: 'd'} },
            {id:1, type: 'foo', checked:false, sub: {name: 'f'} },
            {id:6, type: 'bar', checked:true, sub: {name: 'c'} },
            {id:9, type: 'bar', checked:false, sub: {name: 'a'} },
            {id:3, type: 'bar', checked:true, sub: {name: 'b'} }
        ];
        return itemObjects;
    };

    let isMatchObjectIds = (itemObjects, ids) => {
        let actualIds = itemObjects.map(item=>{
            return item.id;
        });

        for (let idx = 0; idx < ids.length; idx++) {
            if (ids[idx] !== actualIds[idx]) {
                return false;
            }
        }
        return true;
    }

    it('Test sortByOrderExpression()', () => {
        let itemObjects = createItemObjects();

        ObjectSorter.sortByOrderExpression(itemObjects, 'type');
        assert(isMatchObjectIds(itemObjects, [ 6, 9, 3, 5, 2, 1 ]));

        ObjectSorter.sortByOrderExpression(itemObjects, 'id DESC');
        assert(isMatchObjectIds(itemObjects, [ 9, 6, 5, 3, 2, 1 ]));

        ObjectSorter.sortByOrderExpression(itemObjects, 'type, id');
        assert(isMatchObjectIds(itemObjects, [3, 6, 9, 1, 2, 5]));
    });

    it('Test sortByOrderExpression() - deepth', () => {
        let itemObjects = createItemObjects();

        ObjectSorter.sortByOrderExpression(itemObjects, 'sub.name');
        assert(isMatchObjectIds(itemObjects, [ 9, 3, 6, 2, 5, 1 ]));

        ObjectSorter.sortByOrderExpression(itemObjects, 'checked, sub.name');
        assert(isMatchObjectIds(itemObjects, [ 9, 5, 1, 3, 6, 2 ]));

        ObjectSorter.sortByOrderExpression(itemObjects, 'checked, sub.name DESC');
        assert(isMatchObjectIds(itemObjects, [1, 5, 9, 2, 6, 3]));
    });
});