const ObjectUtils = require('../src/objectutils');

var assert = require('assert/strict');

describe('ObjectUtils Test', () => {

    describe('Test isObject()', () => {
        it('Base', () => {
            assert(!ObjectUtils.isObject(undefined));
            assert(!ObjectUtils.isObject([1, 2, 3]));
            assert(!ObjectUtils.isObject(null));
            assert(!ObjectUtils.isObject(new Date()));

            assert(ObjectUtils.isObject({}));
            assert(ObjectUtils.isObject({ name: 'foo' }));

            assert(!ObjectUtils.isObject(123));
            assert(!ObjectUtils.isObject('abc'));
            assert(!ObjectUtils.isObject(true));
            assert(!ObjectUtils.isObject(function () { }));
        });
    });

    describe('Test isEmpty()', () => {
        it('Base', () => {
            let o1 = {
                id: 123,
                name: 'foo'
            };

            let o2 = {};

            assert(!ObjectUtils.isEmpty(o1));
            assert(ObjectUtils.isEmpty(o2));

            o2.id = 456;
            assert(!ObjectUtils.isEmpty(o2));

            o2.id = undefined;
            assert(!ObjectUtils.isEmpty(o2));

            delete o2.id;
            assert(ObjectUtils.isEmpty(o2));
        });
    });

    describe('Test objectEquals()', () => {
        it('Base', () => {
            let o1 = { id: 123, name: 'foo', date: new Date(0), checked: true };
            let o2 = { id: 123, name: 'foo', date: new Date(0), checked: true };

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

        it('Deep', () => {
            let o1 = { id: 123, name: 'foo', addr: { city: 'sz', postcode: '518000' } };
            let o2 = { id: 123, name: 'foo' };

            assert(!ObjectUtils.objectEquals(o1, o2));

            // 补齐对象型属性
            o2.addr = {};
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.city = 'sz';
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.postcode = '518000';
            assert(ObjectUtils.objectEquals(o1, o2));

            // 添加子对象
            o1.addr.detail = { street: 'a', dep: 'b' };
            assert(!ObjectUtils.objectEquals(o1, o2));

            o2.addr.detail = { street: 'a', dep: 'b' };
            assert(ObjectUtils.objectEquals(o1, o2));
        });
    });

    describe('Test arrayEquals()', () => {
        it('Base', () => {
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

        it('Object type element', () => {
            let a = [1, 'abc', { name: 'foo', id: 123 }];
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

        it('Array type element', () => {
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
            a[2].push({ name: 'foo' });
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2].push({ name: 'bar' });
            assert(!ObjectUtils.arrayEquals(a, b));

            b[2][2].name = 'foo';
            assert(ObjectUtils.arrayEquals(a, b));
        });

        it('Array type property in object type element', () => {
            let a = [1, 'abc', { name: 'foo', id: 123, tags: ['x', 'y'] }];
            let b = [1, 'abc', { name: 'foo', id: 123 }];

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

    describe('Test dateEquals()', () => {
        it('Base', () => {
            let d1 = new Date(1);
            let d2 = new Date(2);
            let d3 = new Date(2);

            assert(!ObjectUtils.dateEquals(d1, d2));
            assert(ObjectUtils.dateEquals(d2, d3));
        });
    });

    describe('Test equals()', () => {
        it('Base', () => {
            let o1 = { id: 123, name: 'foo' };
            let o2 = { id: 123, name: 'foo' };
            let o3 = { id: 123, name: 'bar' };

            let a1 = [1, 2, 3];
            let a2 = [1, 2, 3];
            let a3 = [2, 3, 4];

            let d1 = new Date(1);
            let d2 = new Date(1);
            let d3 = new Date(2);

            assert(ObjectUtils.equals(o1, o2));
            assert(!ObjectUtils.equals(o1, o3));

            assert(ObjectUtils.equals(a1, a2));
            assert(!ObjectUtils.equals(a1, a3));

            assert(ObjectUtils.equals(d1, d2));
            assert(!ObjectUtils.equals(d1, d3));

            assert(!ObjectUtils.equals(o1, a1));
            assert(!ObjectUtils.equals(o1, d1));
            assert(!ObjectUtils.equals(a1, d1));
        });
    });

    describe('Test dateClone()', () => {
        it('Base', () => {
            let d1 = new Date(1);
            let d2 = ObjectUtils.dateClone(d1);

            assert(ObjectUtils.dateEquals(d1, d2));
        });
    });

    describe('Test arrayCombine()', () => {
        it('Base', () => {
            let a1 = [2, 3, 4];
            let a2 = [3, 4, 5];

            let c1 = ObjectUtils.arrayCombine(a1, a2);
            assert(ObjectUtils.arrayEquals(c1, [2, 3, 4, 5]));

            let a3 = ['foo', true, new Date(1), 'bar'];
            let a4 = ['bar', true, new Date(1), new Date(2), 123];
            let c2 = ObjectUtils.arrayCombine(a3, a4);
            assert(ObjectUtils.arrayEquals(c2,
                ['foo', true, new Date(1), 'bar', new Date(2), 123]));
        });

        it('Uncomparable elements', () => {
            let a1 = [2, 3, { id: 123, name: 'foo' }];
            let a2 = [3, 4, { id: 123, name: 'foo' }, { id: 456, name: 'bar' }, [7, 8, 9]];

            let c1 = ObjectUtils.arrayCombine(a1, a2);
            assert(ObjectUtils.arrayEquals(c1,
                [2, 3, { id: 123, name: 'foo' },
                    4, { id: 123, name: 'foo' }, { id: 456, name: 'bar' }, [7, 8, 9]]));
        });
    });

    describe('Test arrayConcat()', () => {
        it('Base', () => {
            let a1 = [2, 3, 4];
            let a2 = [3, 4, 5];
            let a3 = [4, 5, 6];

            let c1 = ObjectUtils.arrayConcat(a1, a2);
            assert(ObjectUtils.arrayEquals(c1, [2, 3, 4, 3, 4, 5]));

            let c2 = ObjectUtils.arrayConcat(a1, a2, a3);
            assert(ObjectUtils.arrayEquals(c2,
                [2, 3, 4, 3, 4, 5, 4, 5, 6]));
        });
    });

    describe('Test arraySubtract()', () => {
        let a1 = [2, 3, 4, 4, 5, 5, 6, 7, 8];

        let a2 = [9, 0];
        let a3 = [3, 4, 5];
        let a4 = [2, 10, 20];

        let s1 = ObjectUtils.arraySubtract(a1, a2);
        assert(ObjectUtils.arrayEquals(s1, a1));

        let s2 = ObjectUtils.arraySubtract(a1, a3);
        assert(ObjectUtils.arrayEquals(s2, [2, 6, 7, 8]));

        let s3 = ObjectUtils.arraySubtract(a1, a4);
        assert(ObjectUtils.arrayEquals(s3, [3, 4, 4, 5, 5, 6, 7, 8]));

        let s4 = ObjectUtils.arraySubtract(a1, a3, a4);
        assert(ObjectUtils.arrayEquals(s4, [6, 7, 8]));
    });

    describe('Test arrayAddItems()', () => {
        it('Base', () => {
            let a1 = [2, 3, 4];

            let i1 = ObjectUtils.arrayAddItems(a1, 3, 4, 5);
            assert(ObjectUtils.arrayEquals(i1, [2, 3, 4, 3, 4, 5]));

            let i2 = ObjectUtils.arrayAddItems(a1, 'foo', 'bar');
            assert(ObjectUtils.arrayEquals(i2, [2, 3, 4, 'foo', 'bar']));
        });
    });

    describe('Test arrayRemoveItems()', () => {
        it('Base', () => {
            let a1 = [2, 3, 4, 4, 5, 5, 6, 7, 8];

            let r1 = ObjectUtils.arrayRemoveItems(a1, 9, 0);
            assert(ObjectUtils.arrayEquals(r1, a1));

            let i2 = ObjectUtils.arrayRemoveItems(a1, 3, 4, 5, 6);
            assert(ObjectUtils.arrayEquals(i2, [2, 7, 8]));
        });
    });

    describe('Test arrayDiff()', () => {
        it('Base', () => {
            let a1 = [2, 3, 4, 5];
            let a2 = [4, 5, 6, 7];

            let d1 = ObjectUtils.arrayDiff(a1, a2);
            assert(ObjectUtils.arrayEquals(d1.addedItems, [6, 7]));
            assert(ObjectUtils.arrayEquals(d1.removedItems, [2, 3]));

            let a3 = [2, 3, 3, 4, 4, 5];
            let a4 = [3, 4, 5, 6];

            let d2 = ObjectUtils.arrayDiff(a3, a4);
            assert(ObjectUtils.arrayEquals(d2.addedItems, [6]));
            assert(ObjectUtils.arrayEquals(d2.removedItems, [2]));
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

    describe('Test removePropertiesByKeyValues()', () => {
        it('Base', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                creationTime: new Date(1)
            }

            // 删除一个对象，其中一条目不匹配，另一条目匹配
            let r1 = ObjectUtils.removePropertiesByKeyValues(o1, {
                id: 456,  // different
                name: 'foo' // equals
            });

            assert(ObjectUtils.objectEquals(r1, {
                id: 123,
                creationTime: new Date(1)
            }))

            // 继续删除
            let r2 = ObjectUtils.removePropertiesByKeyValues(r1, {
                id: 123,
                creationTime: new Date(1)
            });

            assert(ObjectUtils.isEmpty(r2));
        });

        it('Deep', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                addr: {
                    city: 'sz',
                    postcode: '518000'
                }
            };

            let r1 = ObjectUtils.removePropertiesByKeyValues(o1,
                {
                    id: 123,
                    addr: {
                        city: 'sz'
                    }
                });

            assert(ObjectUtils.objectEquals(r1, {
                name: 'foo',
                addr: {
                    postcode: '518000'
                }
            }));
        });
    });

    describe('Test collapseKeyValueArray()', () => {
        it('Base', () => {
            let a = [
                { key: 'id', value: 123 },
                { key: 'name', value: 'foobar' }
            ];
            let obj = ObjectUtils.collapseKeyValueArray(a, 'key', 'value');

            assert(ObjectUtils.objectEquals(obj, { id: 123, name: 'foobar' }));
        });
    });

    describe('Test expandKeyValueObject()', () => {
        it('Base', () => {
            let obj = { id: 123, name: 'foobar' };
            let a = ObjectUtils.expandKeyValueObject(obj, 'key', 'value');

            assert(ObjectUtils.arrayEquals(a, [
                { key: 'id', value: 123 },
                { key: 'name', value: 'foobar' }
            ]));
        });
    });

    describe('Test objectMerge()', () => {
        it('Base', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66
            };

            let o2 = {
                score: 99, // 源对象已存在
                addr: 'sz' // 源对象不存在
            };

            let m1 = ObjectUtils.objectMerge(o1, o2);

            assert(ObjectUtils.objectEquals(m1, {
                id: 123,
                name: 'foo',
                score: 66,
                addr: 'sz'
            }));
        });

        it('Deep', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66,
                addr: {
                    city: 'sz',
                    postcode: '518000'
                }
            };

            let o2 = {
                score: 99, // 源对象已存在
                addr: {
                    city: 'gz', // 源子对象已存在
                    province: 'gd' // 源子对象不存在
                },
                checked: true // 源对象不存在
            };

            let m1 = ObjectUtils.objectMerge(o1, o2);

            assert(ObjectUtils.objectEquals(m1, {
                id: 123,
                name: 'foo',
                score: 66,
                addr: {
                    city: 'sz',
                    postcode: '518000',
                    province: 'gd'
                },
                checked: true
            }));
        });

        it('With keyValueModifyFuncs', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66
            };

            let o2 = {
                score: 99, // 源对象已存在
                addr: {
                    city: 'sz' // 源对象不存在
                }
            };

            let m1 = ObjectUtils.objectMerge(o1, o2, {
                score: (oldValue) => {
                    return oldValue + 1;
                },
                'addr.city': (oldValue) => {
                    return 'gz';
                }
            });

            assert(ObjectUtils.objectEquals(m1, {
                id: 123,
                name: 'foo',
                score: 67,
                addr: {
                    city: 'gz'
                }
            }));
        });
    });

    describe('Test objectClone()', () => {
        it('Base', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66
            };

            let c1 = ObjectUtils.objectClone(o1);

            assert(ObjectUtils.objectEquals(c1, {
                id: 123,
                name: 'foo',
                score: 66
            }));
        });

        it('Deep', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66,
                addr: {
                    city: 'sz',
                    postcode: '518000'
                }
            };

            let c1 = ObjectUtils.objectClone(o1);

            assert(ObjectUtils.objectEquals(c1, {
                id: 123,
                name: 'foo',
                score: 66,
                addr: {
                    city: 'sz',
                    postcode: '518000'
                }
            }));
        });

        it('With keyValueModifyFuncs', () => {
            let o1 = {
                id: 123,
                name: 'foo',
                score: 66,
                addr: {
                    city: 'sz'
                }
            };

            let c1 = ObjectUtils.objectClone(o1, {
                score: (oldValue) => {
                    return oldValue + 1;
                },
                'addr.city': (oldValue) => {
                    return 'gz';
                }
            });

            assert(ObjectUtils.objectEquals(c1, {
                id: 123,
                name: 'foo',
                score: 67,
                addr: {
                    city: 'gz'
                }
            }));
        });
    });

    describe('Test arrayClone()', () => {
        it('Base', () => {
            // “基本”数据类型的数组
            let a1 = [123, 'foo', new Date(1)];
            let c1 = ObjectUtils.arrayClone(a1);

            assert(ObjectUtils.arrayEquals(c1,
                [123, 'foo', new Date(1)]));

            // 对象类型的数组
            let a2 = [
                { id: 123, name: 'foo' },
                { id: 456, name: 'bar' }
            ];

            let c2 = ObjectUtils.arrayClone(a2);

            assert(ObjectUtils.arrayEquals(c2,
                [
                    { id: 123, name: 'foo' },
                    { id: 456, name: 'bar' }
                ]
            ));
        });

        it('Deep', () => {
            let a1 = [
                {
                    id: 123, name: 'foo', items: [
                        { date: new Date(1), checked: true, orders: [1, 2, 3] },
                        { date: new Date(2), checked: false, orders: [4, 5] },
                    ]
                },
                {
                    id: 456, name: 'bar', items: [
                        { date: new Date(3), checked: true }
                    ]
                }
            ];

            let c1 = ObjectUtils.arrayClone(a1);

            assert(ObjectUtils.objectEquals(c1,
                [
                    {
                        id: 123, name: 'foo', items: [
                            { date: new Date(1), checked: true, orders: [1, 2, 3] },
                            { date: new Date(2), checked: false, orders: [4, 5] },
                        ]
                    },
                    {
                        id: 456, name: 'bar', items: [
                            { date: new Date(3), checked: true }
                        ]
                    }
                ]
            ));
        });

        it('With keyValueModifyFuncs', () => {
            let a1 = [
                {
                    id: 123, name: 'foo', items: [
                        { date: new Date(1), checked: true, orders: [1, 2, 3] },
                        { date: new Date(2), checked: false, orders: [4, 5] },
                    ]
                },
                {
                    id: 456, name: 'bar', items: [
                        { date: new Date(3), checked: true }
                    ]
                }
            ];

            let c1 = ObjectUtils.arrayClone(a1, {
                '[].id': (oldValue) => {
                    return oldValue + 1;
                },
                '[].items.[].checked': (oldValue) => {
                    return !oldValue;
                }
            });

            assert(ObjectUtils.objectEquals(c1,
                [
                    {
                        id: 124, name: 'foo', items: [
                            { date: new Date(1), checked: false, orders: [1, 2, 3] },
                            { date: new Date(2), checked: true, orders: [4, 5] },
                        ]
                    },
                    {
                        id: 457, name: 'bar', items: [
                            { date: new Date(3), checked: false }
                        ]
                    }
                ]
            ));
        });
    });

    describe('Test clone()', () => {
        let o1 = { id: 123 };
        let a1 = [1, 2, 3];

        let c1 = ObjectUtils.clone(o1);
        let c2 = ObjectUtils.clone(a1);

        assert(ObjectUtils.equals(c1, o1));
        assert(ObjectUtils.equals(c2, a1));
    });

    describe('Test pruneObject()', () => {
        let o1 = {
            id: 123,
            name: 'foo',
            addr: { city: 'sz', postcode: '518000' },
            checked: true,
            creationTime: new Date(1)
        };

        let p1 = ObjectUtils.pruneObject(o1, ['id', 'name']);
        let p2 = ObjectUtils.pruneObject(o1, ['id', 'name', 'addr']);
        let p3 = ObjectUtils.pruneObject(o1, ['id', 'checked', 'creationTime']);
        let p4 = ObjectUtils.pruneObject(o1, ['name', 'score']); // 'score' 为一个源对象不存在的属性

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
            name: 'foo'
        }));
    });
});
