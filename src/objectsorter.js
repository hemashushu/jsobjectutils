const ObjectAccessor = require('./objectaccessor');
const OrderField = require('./orderfield');

/**
 * 对对象数组按对象的指定属性进行排序
 */
class ObjectSorter {

    /**
     * 解析排序条件表达式（字符串）为一组排序字段对象（Condition）
     *
     * - 排序表达式为一个以逗号分隔的，待排序的（项目对象的）属性名称拼接
     *   而成的字符串，比如：
     *   'name, size'
     *   上面表达式表示先以 'name' 排序，然后再以 'size' 排序，其中 name 和 size
     *   都是项目对象的属性名称。
     *
     * - 如果项目对象的属性值是一个（子）对象，则可以通过名称路径（name path）来指定
     *   子对象的属性，比如：
     *   'meta.type, name'
     *   上面表达式表示先以子对象 meta 的属性 type 排序，然后再以 name 属性排序。
     *
     * - 如果属性名称里有空格，点号（.）或者其他特殊字符，需要使用单引号包括起来，
     *   如果名称里含有单引号，则使用两个连续单引号表示一个单引号。
     *
     * - 每个属性后面都可以添加 'DESC' 后缀，表示该属性值按 “倒序” 排序，比如：
     *   'meta.flag, creationTime DESC, name'
     *   上面表达式表示先按 'meta.flag' 正序排序，然后按 'creationTime' 倒序排序，最后
     *   按 'name' 正序排序。
     *
     * @param {*} orderExpression 一个字符串，排序条件表达式。格式是以逗号分隔，
     *     拼接各个待排序的（项目对象的）属性名称。
     * @returns 返回 OrderField 对象数组，[OrderField, ...]
     */
    static parseOrderExpression(orderExpression) {
        let orderFields = [];

        if (orderExpression === '') {
            return orderFields;
        }

        let nameAscendingPairs = []; // [{name: String, ascending: String}, ...]
        let nameBuffer = [];
        let ascendingBuffer = [];
        let state = 'expect-name-start';

        let resetBuffer = ()=>{
            nameBuffer = [];
            ascendingBuffer = [];
        };

        let appendNameAscendingPair = () => {
            let name = nameBuffer.join('');
            let ascending = ascendingBuffer.join('');
            name = name.trim();
            ascending = ascending.trim();
            nameAscendingPairs.push({ name, ascending });
        };

        for (let idx = 0; idx < orderExpression.length; idx++) {
            let c = orderExpression[idx];

            switch (state) {
                case 'expect-name-start':
                    {
                        if (c === ' ') {
                            continue;
                        } else
                            if (c === '"') {
                                resetBuffer();
                                state = 'expect-double-quote-end';
                            } else if (c === '\'') {
                                resetBuffer();
                                state = 'expect-single-quote-end';
                            } else {
                                resetBuffer();
                                nameBuffer.push(c);
                                state = 'expect-name-end';
                            }
                        break;
                    }

                case 'expect-double-quote-end':
                    {
                        if (c === '"') {
                            // 当前是双引号结束, nameBuffer 已经完成
                            state = 'expect-ascending-start';
                        } else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-single-quote-end':
                    {
                        if (c === '\'') {
                            if (idx + 1 < orderExpression.length &&
                                orderExpression[idx + 1] === '\'') {
                                // 单引号之内有两个连续单引号，表示一个单引号字符的意思
                                nameBuffer.push('\'');
                                idx += 1;
                            } else {
                                // 当前是单引号结束，nameBuffer 已完成
                                state = 'expect-ascending-start';
                            }
                        } else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-name-end':
                    {
                        if (c === ',') {
                            // 当前是单个属性结束
                            appendNameAscendingPair();

                            // 开始下一个属性
                            state = 'expect-name-start';
                        } else if (c === ' ') {
                            // 当前是遇到属性名称和排序方向关键字 'DESC' 之间的空格，nameBuffer 已完成
                            state = 'expect-ascending-start';

                        } else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-ascending-start':
                    {
                        if (c === ' ') {
                            continue;
                        }else if (c === ',') {
                            // 当前是单个属性结束
                            appendNameAscendingPair();

                            // 开始下一个属性
                            state = 'expect-name-start';

                        }else {
                            ascendingBuffer.push(c);
                            state = 'expect-ascending-end';
                        }
                        break;
                    }

                case 'expect-ascending-end':
                    {
                        if (c === ',') {
                            // 当前是单个属性结束
                            appendNameAscendingPair();

                            // 开始下一个属性
                            state = 'expect-name-start';

                        } else if ('desc'.indexOf(c.toLowerCase()) >= 0) {
                            ascendingBuffer.push(c);

                        } else {
                            // 语法错误
                            return orderFields;
                        }
                        break;
                    }
            }
        }

        if (state === 'expect-name-end' ||
            state === 'expect-double-quote-end' ||
            state === 'expect-single-quote-end' ||
            state === 'expect-ascending-start' ||
            state === 'expect-ascending-end') {
            if (nameBuffer.length > 0) {
                appendNameAscendingPair();
            }
        }

        for(let nameAscendingPair of nameAscendingPairs) {
            let orderField;
            if (nameAscendingPair.ascending.toLowerCase() === 'desc') {
                orderField = new OrderField(nameAscendingPair.name, false);
            }else {
                orderField = new OrderField(nameAscendingPair.name, true);
            }

            orderFields.push(orderField);
        }

        return orderFields;
    }

    /**
     * 排序对象数组
     *
     * 方法无返回值，排序操作直接在原数组上实现
     *
     * @param {*} container
     * @param {*} lastElements
     * @param {*} orderFields
     * @param {*} itemObjectMapFunc
     */
    static sort(itemObjects, orderFields) {
        itemObjects.sort((leftItemObject, rightItemObject) => {
            return ObjectSorter.compareObject(leftItemObject, rightItemObject, orderFields);
        });
    }

    /**
     * 根据排序表达式排序对象数组
     *
     * 方法无返回值，排序操作直接在原数组上实现
     *
     * @param {*} itemObjects
     * @param {*} orderExpression 详细语法见 parseOrderExpression 方法。
     */
    static sortByOrderExpression(itemObjects, orderExpression) {
        let orderFields = ObjectSorter.parseOrderExpression(orderExpression);
        ObjectSorter.sort(itemObjects, orderFields);
    }

    /**
     * 根据一组条件对象比较两个项目对象。
     *
     * @param {*} leftItemObject
     * @param {*} rightItemObject
     * @param {*} orderFields
     * @returns 返回 -1, 0, 1。
     *     - 当左边小于右边时返回 -1
     *     - 当左边等于右边时返回 0
     *     - 当左边大于右边时返回 1
     */
    static compareObject(leftItemObject, rightItemObject, orderFields) {
        let result = 0;

        for (let { fieldName, isAscendingOrder } of orderFields) {
            let fieldResult = ObjectSorter.compareField(leftItemObject, rightItemObject, fieldName);

            if (fieldResult === 0) {
                // 分不出高低，所以继续检查下一个条件
            } else {
                if (isAscendingOrder) {
                    result = fieldResult;
                } else {
                    result = -fieldResult;
                }
                break;
            }
        }

        return result;
    }

    /**
     * 比较两个项目对象指定属性（或名称路径 name path）的值的大小
     *
     * @param {*} leftItemObject
     * @param {*} rightItemObject
     * @param {*} namePath
     * @returns 返回 -1, 0, 1。
     *     - 当左边小于右边时返回 -1
     *     - 当左边等于右边时返回 0
     *     - 当左边大于右边时返回 1
     */
    static compareField(leftItemObject, rightItemObject, namePath) {
        let leftValue = ObjectAccessor.getPropertyValueByNamePath(leftItemObject, namePath);
        let rightValue = ObjectAccessor.getPropertyValueByNamePath(rightItemObject, namePath);

        if (leftValue === undefined && rightValue === undefined) {
            return 0;
        } else if (leftValue === undefined) {
            return -1;
        } else if (rightValue === undefined) {
            return 1;
        } else if (leftValue === null && rightValue === null) {
            return 0;
        } else if (leftValue === null) {
            return -1;
        } else if (rightValue === null) {
            return 1;
        } else {
            // - Date 对象可以通过 "<" 和 ">" 符号正确比较大小，但无法使用
            //   "==" 或者 "===" 符号判断是否值相等。
            // - 对于 Boolean 类型，true > false
            if (leftValue < rightValue) {
                return -1;
            } else if (leftValue > rightValue) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}

module.exports = ObjectSorter;