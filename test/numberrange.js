const assert = require('assert/strict');

const { NumberRange, ObjectUtils } = require('../index');

describe('ObjectAccessor Test', () => {
    it('Test iterator', ()=>{
        let numberRange1 = new NumberRange(0, 10);

        let ns1 = [];
        for(let n of numberRange1) {
            ns1.push(n);
        }

        assert(ObjectUtils.arrayEquals(ns1, [0,1,2,3,4,5,6,7,8,9]));

        let numberRange2 = new NumberRange(0, 10, 2);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange2),
            [0,2,4,6,8]));

        let numberRange3 = new NumberRange(0, 10, 3);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange3),
            [0,3,6,9]));

        let numberRange4 = new NumberRange(0, 10, 4);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange4),
            [0,4,8]));

        let numberRange5 = new NumberRange(0, 10, 5);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange5),
            [0,5]));

        let numberRange6 = new NumberRange(0, 10, 6);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange6),
            [0,6]));

        let numberRange9 = new NumberRange(0, 10, 9);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange9),
            [0,9]));

        let numberRange10 = new NumberRange(0, 10, 10);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange10),
            [0]));
    });

    it('Test index', ()=>{
        let numberRange1 = NumberRange.buildIndexedNumberRange(0, 10);

        assert.equal(numberRange1.length, 10);
        let ns1 = [];
        for(let idx=0; idx<numberRange1.length; idx++) {
            ns1.push(numberRange1[idx]);
        }

        assert(ObjectUtils.arrayEquals(ns1, [0,1,2,3,4,5,6,7,8,9]));
        assert(numberRange1[10] === undefined);

        let numberRange2 = NumberRange.buildIndexedNumberRange(0, 10, 2);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange2),
            [0,2,4,6,8]));

        let numberRange3 = NumberRange.buildIndexedNumberRange(0, 10, 3);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange3),
            [0,3,6,9]));

        let numberRange4 = NumberRange.buildIndexedNumberRange(0, 10, 4);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange4),
            [0,4,8]));

        let numberRange5 = NumberRange.buildIndexedNumberRange(0, 10, 5);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange5),
            [0,5]));

        let numberRange6 = NumberRange.buildIndexedNumberRange(0, 10, 6);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange6),
            [0,6]));

        let numberRange9 = NumberRange.buildIndexedNumberRange(0, 10, 9);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange9),
            [0,9]));

        let numberRange10 = NumberRange.buildIndexedNumberRange(0, 10, 10);
        assert(ObjectUtils.arrayEquals(
            Array.from(numberRange10),
            [0]));
    });
});