const ObjectUtils = require('../src/objectutils');

var assert = require('assert/strict');

describe('ObjectUtils Test', () => {

    describe('Test objectEquals()', ()=> {
        it('Base', ()=>{
            let o1 = {id: 123, name: 'foo', date: new Date(0), checked: true};
            let o2 = {id: 123, name: 'foo', date: new Date(0), checked: true};

            assert(ObjectUtils.objectEquals(o1, o2));

            // 比较 boolean 型属性
            o2.checked = false;
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.checked = true;
            assert(ObjectUtils.objectEquals(o1, o2));

            // 比较 string 型属性
            o2.name = 'bar';
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.name = 'foo';
            assert(ObjectUtils.objectEquals(o1, o2));

            // 增加属性
            o2.addr = 'a, b, c';
            assert(!ObjectUtils.objectEquals(o1, o2));

            delete o2.addr;
            assert(ObjectUtils.objectEquals(o1, o2));
        });

        it('Deep', ()=>{
            let o1 = {id: 123, name: 'foo', addr: {city: 'sz', postcode:'518000'}};
            let o2 = {id: 123, name: 'foo'};

            assert(!ObjectUtils.objectEquals(o1, o2));

            // 补齐对象型属性
            o2.addr = {};
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.city = 'sz';
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.postcode = '518000';
            assert(ObjectUtils.objectEquals(o1, o2));

            // 添加子对象
            o1.addr.detail = {street: 'a', dep: 'b'};
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.detail = {street: 'a', dep: 'b'};
            assert(ObjectUtils.objectEquals(o1, o2));
        });
    });

    describe('Test arrayEquals()', ()=>{
        it('Base', ()=>{
            let a = [1, 'abc', true];
            let b = [1, 'abc', true];

            assert(ObjectUtils.arrayEquals(a, b));

            // 更改元素值
            b[1] = 'xyz';
            assert(!ObjectUtils.arrayEquals(a, b));

            b[1] = 'abc';
            assert(ObjectUtils.arrayEquals(a, b));

            // 更改顺序
            let tail = b.pop();
            b.unshift(tail);
            assert(!ObjectUtils.arrayEquals(a, b));

            let head = b.shift();
            b.push(head);
            assert(ObjectUtils.arrayEquals(a, b));

            // 增加元素
            b.push(new Date(1));
            assert(!ObjectUtils.arrayEquals(a, b));

            a.push(new Date(1));
            assert(ObjectUtils.arrayEquals(a, b));
        });

        it('Object type element', ()=>{
            let a = [1, 'abc', {name: 'foo', id: 123}];
            let b = [1, 'abc'];

            assert(!ObjectUtils.arrayEquals(a, b));

            // 补齐对象型元素
            b.push({});
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].name = 'foo';
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].id = 123;
            assert(ObjectUtils.arrayEquals(a, b));
        });

        it('Array type element', ()=>{
            let a = [1, 'abc', [2, 3]];
            let b = [1, 'abc'];

            assert(!ObjectUtils.arrayEquals(a, b));

            // 补齐数组型元素
            b.push([]);
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].push(2);
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].push(3);
            assert(ObjectUtils.arrayEquals(a, b));

            // 数组元素里添加对象型子元素
            a[2].push({name: 'foo'});
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].push({name: 'bar'});
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2][2].name = 'foo';
            assert(ObjectUtils.arrayEquals(a, b));
        });

        it('Array type property in object type element', ()=>{
            let a = [1, 'abc', {name: 'foo', id: 123, tags: ['x', 'y']}];
            let b = [1, 'abc', {name: 'foo', id: 123}];

            assert(!ObjectUtils.arrayEquals(a, b));

            // 补齐对象型元素里面的子数组
            b[2].tags = [];
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].tags.push('x');
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].tags.push('y');
            assert(ObjectUtils.arrayEquals(a, b));
        });
    });

    describe('Test collapseKeyValueArray()', () => {
        it('Base',() => {
            let a = [{key: 'id', value: 123}, {key: 'name', value: 'foobar'}];
            let obj = ObjectUtils.collapseKeyValueArray(a, 'key', 'value');

            assert(ObjectUtils.objectEquals(obj, {id: 123, name: 'foobar'}));
        });
    });

    describe('Test arrayIncludesAll()', () => {
        it('Base', () => {
            let a = [1, 2, 3, 4];

            assert(ObjectUtils.arrayIncludesAll(a, [1, 2, 3, 4]));
            assert(ObjectUtils.arrayIncludesAll(a, [2, 3]));

            assert(!ObjectUtils.arrayIncludesAll(a, [3, 4, 5, 6]));
            assert(!ObjectUtils.arrayIncludesAll(a, [5, 6]));
        });
    });

    describe('Test arrayAbsents()', () => {
        it('Base', () => {
            let a = [1, 2, 3, 4];

            assert(ObjectUtils.arrayAbsents(a, 5));
            assert(ObjectUtils.arrayAbsents(a, 'a'));

            assert(!ObjectUtils.arrayAbsents(a, 1));
            assert(!ObjectUtils.arrayAbsents(a, 3));
        });
    });

    describe('Test arrayAbsentsAll()', () => {
        it('Base', () => {
            let a = [1, 2, 3, 4];

            assert(ObjectUtils.arrayAbsentsAll(a, [5, 6]));
            assert(ObjectUtils.arrayAbsentsAll(a, ['a', 'b']));

            assert(!ObjectUtils.arrayAbsentsAll(a, [1, 3]));
            assert(!ObjectUtils.arrayAbsentsAll(a, [3, 5, 6]));
        });
    });

    describe('Test getPropertyValueByNamePath()', () => {
        it('Base', () => {
            let a = {
                id: 123,
                addr: {
                    city: 'abc',
                    street: 'xyz'
                },
                name: 'foobar'
            };

            assert.equal(ObjectUtils.getPropertyValueByNamePath(a, 'id'), 123);
            assert.equal(ObjectUtils.getPropertyValueByNamePath(a, 'name'), 'foobar');
            assert.equal(ObjectUtils.getPropertyValueByNamePath(a, 'addr.city'), 'abc');
            assert.equal(ObjectUtils.getPropertyValueByNamePath(a, 'addr.street'), 'xyz');

            assert(ObjectUtils.getPropertyValueByNamePath(a, 'no') === undefined);
            assert(ObjectUtils.getPropertyValueByNamePath(a, 'no.way') === undefined);
        });
    });

    describe('Test object merge', () => {
        it('Base object merge', () => {
            let s = {
                id: 123,
                name: 'foo',
                score: 66
            };

            let d = {
                score: 99,
                addr: '1st rd.'
            };

            ObjectUtils.objectMerge(s, d);


        });
    });
});
