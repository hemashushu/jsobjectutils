/**
 * 一个表示数值范围的对象，可以迭代范围当中的每一个值。
 */
class NumberRange {
    /**
     * 构造一个新的数值范围对象。
     *
     * @param {*} from 范围的开始
     * @param {*} to 范围的结束（不包括此值）
     * @param {*} step 步进值，默认为 1
     */
    constructor(from, to, step = 1) {
        this.from = from;
        this.to = to;
        this.step = step;
    }

    [Symbol.iterator]() {
        this.current = this.from;
        return this;
    }

    next() {
        let value = this.current;
        if (value < this.to) {
            this.current += this.step;
            return { done: false, value: value };
        } else {
            return { done: true };
        }
    }

    static buildIndexedNumberRange(from, to, step = 1) {
        let numberRange = new NumberRange(from, to, step);
        let length = Math.trunc((to - from - 1) / step) + 1;

        let p = new Proxy(numberRange, {
            get(target, prop) {
                if (typeof(prop) === 'symbol') {
                    return target[prop];

                }else if (isNaN(prop)){
                    if (prop === 'length') {
                        return length;
                    }else {
                        return target[prop];
                    }

                }else {
                    let idx = Number(prop);
                    if (idx >= 0 && idx <length) {
                        let value = from + (step * idx);
                        return value;
                    }else {
                        return;
                    }
                }
            }
        });

        return p;
    }
}

module.exports = NumberRange;