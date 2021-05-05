/**
 * 对纯数据类型的 Object 和 Array 的一些常用操作。
 *
 * Some common operations on the pure data types Object and Array.
 */
class ObjectUtils {

    /**
     * 合并两个纯数据类型的对象
     *
     * sourceObject 的所有 keyValue 会被直接复制到 targetObject（输出对象），
     *
     * defaultObject 的 keyValue 也会被复制到 targetObject 仅当：
     * 1. sourceObject 不存在相应的 key；
     * 2. sourceObject 存在相应的 key，但值为 undefined（注意不是 null）；
     *
     * 如果某个 key 的值为 function 类型，其值会被替换为 undefined。
     *
     * - - -
     * Merging two objects of pure data type
     *
     * all keyValue of sourceObject will be copied directly to
     * targetObject (output object), and
     *
     * The keyValue of defaultObject will also be copied to targetObject only if.
     * 1. the corresponding key does not exist for the sourceObject.
     * 2. the corresponding key exists for the sourceObject, but the
     * value is undefined (note that it is not null).
     *
     * If the type of the value of a key is 'function', the value
     * will be replaced with undefined.
     *
     * @param {*} sourceObject 源对象，keyValue 被优先保留的对象。
     *     The source object, the object whose keyValue is reserved first.
     * @param {*} defaultObject 默认对象，keyValue 作为后备（补充）的对象。
     *     The default object, with the keyValue as the fallback object.
     * @param {*} keyValueModifyFuncs 值修改方法
     *     Value modification method
     * @returns
     */
    static objectMerge(sourceObject, defaultObject, keyValueModifyFuncs) {
        return ObjectUtils._objectMerge(sourceObject, defaultObject, keyValueModifyFuncs);
    }

    // PRIVATE
    static _objectMerge(sourceObject, defaultObject, keyValueModifyFuncs, objectNamePath) {
        let targetObject = {};

        // ## keyValueModifyFuncs：
        //
        // 一个值修改方法的映射（Map），结构如下:
        // {
        //		"namePath": function("the original property's value of the source object"){
        //				return "new value";
        //			},
        //		...
        // }
        //
        // namePath 可以是属性的名称，也可以是属性的名称路径，名称路径即 “父-子” 对象的属性名称的连接，比如：
        // 'foo.bar' 表示：
        // {
        //    foo: {
        //        bar: ...
        //         }
        // }

        // ## objectNamePath:
        //
        // 当前对象的 name path，内部使用的参数

        // Object.keys 相当于 for...in + hasOwnProperty
        //
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty

        let sourceObjectKeys = Object.keys(sourceObject);
        let defaultObjectKeys = Object.keys(defaultObject);

        for (let sourceObjectKey of sourceObjectKeys) {
            let sourceValue = sourceObject[sourceObjectKey];
            let sourceValueType = typeof (sourceValue);

            // 构建当前 key 的名称路径（name path）
            let keyNamePath = (objectNamePath === undefined) ?
                sourceObjectKey : objectNamePath + '.' + sourceObjectKey;

            if (keyValueModifyFuncs !== undefined) {
                let keyValueModifyFunc = keyValueModifyFuncs[keyNamePath];
                if (keyValueModifyFunc !== undefined) {
                    // 添加经过修改方法返回的新值
                    targetObject[sourceObjectKey] = keyValueModifyFunc(sourceValue);
                    continue;
                }
            }

            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray

            if (sourceValue === undefined) {
                // 源值为 undefined
                targetObject[sourceObjectKey] = undefined;

            } else if (Array.isArray(sourceValue)) {
                // 源值是一个数组
                targetObject[sourceObjectKey] = ObjectUtils._arrayClone(sourceValue, keyValueModifyFuncs, keyNamePath);

            } else if (sourceValue === null) {
                // 源值为 null

                // null 也被视为一种存在的值，以防止被 defaultObject 覆盖。
                targetObject[sourceObjectKey] = null;

            } else if (sourceValue instanceof Date) {
                // 源值为一个 Date 对象，因为使用 typeof 方法返回的也是 'object'，所以需要单独复制它。
                targetObject[sourceObjectKey] = ObjectUtils.dateClone(sourceValue);

            } else if (sourceValueType === 'object') {
                // 源值是一个对象

                let defaultValue = defaultObject[sourceObjectKey];
                let defaultValueType = typeof(defaultValue);

                if (defaultObjectKeys.indexOf(sourceObjectKey) >= 0 &&
                    defaultValue !== undefined &&
                    !Array.isArray(defaultValue) &&
                    defaultValue !== null &&
                    !(defaultValue instanceof Date) &&
                    defaultValueType === 'object') {

                    // 源值和默认值都是一个对象，需要进行深层合并
                    targetObject[sourceObjectKey] = ObjectUtils._objectMerge(
                        sourceValue, defaultValue, keyValueModifyFuncs, keyNamePath);

                } else {
                    // 默认对象里不存在相应的 key，
                    // 或者虽然存在，但不是纯数据 'object' 类型，
                    // 这种情况下，只能直接采用源值而丢弃默认值。
                    targetObject[sourceObjectKey] = ObjectUtils._objectClone(
                        sourceValue, keyValueModifyFuncs, keyNamePath);
                }

            } else if (sourceValueType === 'function') {
                // 源值是一个 function，纯数据对象不允许函数类型的属性值，故替换为 undefined
                targetObject[sourceObjectKey] = undefined;

            } else {
                // 源值可能是一些基本数据类型，比如 "boolean"、“number”、“bigint”、“string”、“symbol”
                targetObject[sourceObjectKey] = sourceValue;
            }
        }

        // 接下来复制仅存在于 default 对象的 keyValue。
        for (let defaultObjectKey of defaultObjectKeys) {

            if (sourceObjectKeys.indexOf(defaultObjectKey) >= 0 &&
                sourceObject[defaultObjectKey] !== undefined) {
                // 跳过 sourceObject 已存在且值不为 undefined 的 key
                continue;
            }

            let defaultValue = defaultObject[defaultObjectKey];
            let defaultValueType = typeof (defaultValue);

            let keyNamePath = (objectNamePath === undefined) ?
                defaultObjectKey : objectNamePath + '.' + defaultObjectKey;

            if (defaultValue === undefined) {
                // 默认值为 undefined
                targetObject[defaultObjectKey] = undefined;

            } else if (Array.isArray(defaultValue)) {
                // 默认值是一个 Array
                targetObject[defaultObjectKey] = ObjectUtils._arrayClone(
                    defaultValue, keyValueModifyFuncs, keyNamePath);

            } else if (defaultValue === null) {
                // 默认值是 null

                // null 也被视为一种存在的值，复制到 targetObject，以防止
                // 该 key 在将来的 objectMerge 调用中被覆盖。
                targetObject[defaultObjectKey] = null;

            } else if (defaultValue instanceof Date) {
                // 默认值为一个 Date 对象

                // 因为使用 typeof 方法返回的也是 'object'，所以需要单独复制它。
                targetObject[defaultObjectKey] = ObjectUtils.dateClone(defaultValue);

            } else if (defaultValueType === 'object') {
                // 默认值是一个对象
                targetObject[defaultObjectKey] = ObjectUtils._objectClone(
                    defaultValue, keyValueModifyFuncs, keyNamePath);

            } else if (defaultValueType === 'function') {
                // 默认值是一个 function，纯数据对象不允许函数类型的属性值，故替换为 undefined
                targetObject[defaultObjectKey] = undefined;

            } else {
                targetObject[defaultObjectKey] = defaultValue;
            }
        }

        return targetObject;
    }

    /**
     *
     * 合并两个数组不重复的元素
     *
     * 当前只支持比较数组中数据类型为 **字符串、数字、Date、Bigint、Boolean 等类型** 的元素，其他
     * 数据类型的元素因为无法（跟目标数组中已存在的元素）进行比较，所以它们将被直接 clone。
     *
     * 比如 [2,3,4] 和 [3,4,5] 将合并成为 [2,3,4,5]
     *
     * undefined，null 等元素会被保留到目标数组，类型为 function 的元素会被替换为 undefined。
     *
     * @param {*} sourceArray
     * @param {*} defaultArray
     * @param {*} keyValueModifyFuncs
     * @returns
     */
    static arrayMerge(sourceArray, defaultArray, keyValueModifyFuncs) {
        return ObjectUtils._arrayMerge(sourceArray, defaultArray, keyValueModifyFuncs);
    }

    // PRIVATE
    static _arrayMerge(sourceArray, defaultArray, keyValueModifyFuncs, arrayNamePath) {

        // 当一个对象里的某个 key 的值为 Array 时，而 Array 里的元素又
        // 是一个对象时，比如：
        //
        // {
        //   foo: [
        //     {bar:...},
        //     {bar:...},
        //     ...
        //   ]
        // }
        //
        // 则使用 "foo.[].bar" 作为 "bar" 的名称路径（name path）。
        //
        // 对于对象：
        // {
        //   foo: [[{bar:...}]]
        // }
        //
        // "bar" 的名称路径为 "foo.[].[].bar"

        let elementNamePath = (arrayNamePath === undefined) ?
            '[]' : arrayNamePath + '.' + '[]';

        // 为防止源数组被修改，deep clone 一份源数组。
        // 当应用于不需要态严谨的场合时，这里也可以使用 sourceArray.slice() 进行浅 clone
        let targetArray = ObjectUtils._arrayClone(sourceArray, keyValueModifyFuncs, arrayNamePath);

        let sourceArrayLength = sourceArray.length;

        for (let defaultValue of defaultArray) {
            let defaultValueType = typeof (defaultValue);

            if (defaultValue === undefined) {
                // 默认值为 undefined，无法比较，故直接添加到目标数组
                targetArray.push(undefined);

            } else if (Array.isArray(defaultValue)) {
                // 默认值为 Array。
                // 因为无法与已存在的元素进行比较，故直接 clone。
                targetArray.push(ObjectUtils._arrayClone(
                    defaultValue, keyValueModifyFuncs, elementNamePath));

            } else if (defaultValue === null) {
                // 默认值为 null
                // 因为无法与已存在的元素进行比较，故直接添加到目标数组
                targetArray.push(null);

            } else if (defaultValue instanceof Date) {
                // 默认值为 Date 类型数据，先进行比较再决定是否 clone。
                let found = false;
                for (let idx = 0; idx < sourceArrayLength; idx++) {
                    if (targetArray[idx] instanceof Date &&
                        ObjectUtils.dateEquals(targetArray[idx], defaultValue)) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    targetArray.push(
                        ObjectUtils.dateClone(defaultValue));
                }

            } else if (defaultValueType === 'object') {
                // 默认值是一个对象
                targetArray.push(
                    ObjectUtils._objectClone(defaultValue, keyValueModifyFuncs, elementNamePath));

            } else if (
                // 'string', 'number', 'boolean' 和 'bigint' 先进行比较，然后再决定是否添加到 targetArray
                ['string', 'number', 'boolean', 'bigint'].includes(defaultValueType)) {

                let found = false;
                for (let idx = 0; idx < sourceArrayLength; idx++) {
                    if (targetArray[idx] === defaultValue) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    targetArray.push(defaultValue);
                }

            } else if (defaultValueType === 'function') {
                // 默认值的类型为 function，纯数据类型 Array 不允许这种类型，所以需替换为 undefined
                targetArray.push(undefined);

            } else {
                // 其他数据类型直接添加到 targetArray
                targetArray.push(defaultValue);
            }
        }

        return targetArray;
    }

    /**
     * 对象的深度克隆
     *
     * @param {*} sourceObject
     * @param {*} keyValueModifyFuncs
     * @returns
     */
    static objectClone(sourceObject, keyValueModifyFuncs) {
        return ObjectUtils._objectClone(sourceObject, keyValueModifyFuncs);
    }

    // PRIVATE
    static _objectClone(sourceObject, keyValueModifyFuncs, objectNamePath) {
        return ObjectUtils._objectMerge(
            sourceObject, {}, keyValueModifyFuncs, objectNamePath);
    }

    /**
     * 数组的深度克隆
     *
     * @param {*} sourceArray
     * @param {*} keyValueModifyFuncs
     * @returns
     */
    static arrayClone(sourceArray, keyValueModifyFuncs) {
        return ObjectUtils._arrayClone(sourceArray, keyValueModifyFuncs);
    }

    // PRIVATE
    static _arrayClone(sourceArray, keyValueModifyFuncs, arrayNamePath) {
        let elementNamePath = (arrayNamePath === undefined) ?
            '[]' : arrayNamePath + '.' + '[]';

        let targetArray = [];
        for (let item of sourceArray) {
            targetArray.push(ObjectUtils._clone(item, keyValueModifyFuncs, elementNamePath));
        }

        return targetArray;
    }

    /**
     * 深度 clone 一个对象或数组。
     *
     * @param {*} source
     * @param {*} keyValueModifyFuncs
     * @returns
     */
    static clone(source, keyValueModifyFuncs) {
        return ObjectUtils._clone(source, keyValueModifyFuncs);
    }

    // PRIVATE
    static _clone(source, keyValueModifyFuncs, namePath) {
        let target;

        if (source === undefined) {
            //
        } else if (Array.isArray()) {
            target = ObjectUtils._arrayClone(
                source, keyValueModifyFuncs, namePath);

        } else if (source === null) {
            target = null;

        } else if (source instanceof Date) {
            target = ObjectUtils.dateClone(source);

        } else if (typeof source === 'object') {
            target =ObjectUtils._objectClone(
                source, keyValueModifyFuncs, namePath);

        } else if (typeof source === 'function') {
            //
        } else {
            target = source;
        }

        return target;
    }

    /**
     * 挑选对象中指定名称的 keyValues 并形成一个新的对象
     *
     * @param {*} sourceObject
     * @param {*} keys 期望保留的属性名称数组（string Array），当省略这个参数时，
     *     该方法等同于 objectClone 方法。
     */
    static pruneObject(sourceObject, keys) {
        if (keys === undefined) {
            return ObjectUtils.objectClone(sourceObject);
        }else {
            let targetObject = {};

            for (let key of keys) {
                let sourceValue = sourceObject[key];
                targetObject[key] = ObjectUtils.clone(sourceValue);
            }

            return targetObject;
        }
    }

    /**
     * 深度比较两个对象。
     *
     * 如果两个对象均为 undefined，或者均为 null，则它们被视为相等。
     *
     * @param {*} leftObject
     * @param {*} rightObject
     * @returns
     */
    static objectEquals(leftObject, rightObject) {
        if (leftObject === undefined && rightObject === undefined) {
            return true;
        }

        if (leftObject === undefined || rightObject === undefined) {
            return false;
        }

        if (leftObject === null && rightObject === null) {
            return true;
        }

        if (leftObject === null || rightObject === null) {
            return false;
        }

        if (leftObject instanceof Date) {
            if (rightObject instanceof Date) {
                return ObjectUtils.dateEquals(leftObject, rightObject);
            }
        }

        if (typeof leftObject === 'object') {
            if (typeof rightObject === 'object') {
                let leftKeys = Object.keys(leftObject);
                let rightKeys = Object.keys(rightObject);

                if (leftKeys.length !== rightKeys.length) {
                    // keyValue 条目数量不一致。
                    return false;
                }

                if (leftKeys.length === 0) {
                    // 两个对象都是空的。
                    return true;
                }

                // 逐个 keyValue 比较

                for (let leftKey of leftKeys) {
                    let leftValue = leftObject[leftKey];

                    if (rightKeys.indexOf(leftKey) === -1) {
                        // right 对象不存在相应的 key
                        return false;
                    }

                    let rightValue = rightObject[leftKey];

                    if (leftKey === undefined) {
                        if (rightValue === undefined) {
                            continue;
                        }

                        return false;
                    }

                    if (Array.isArray(leftValue)) {
                        if (Array.isArray(rightValue)) {
                            if (ObjectUtils.arrayEquals(leftValue, rightValue)) {
                                continue;
                            }
                        }

                        return false;
                    }

                    if (leftValue === null) {
                        if (rightValue === null) {
                            continue;
                        }

                        return false;
                    }

                    if (leftValue instanceof Date) {
                        if (rightValue instanceof Date) {
                            if (ObjectUtils.dateEquals(leftValue, rightValue)) {
                                continue;
                            }
                        }

                        return false;
                    }

                    if (typeof leftValue === 'object') {
                        if (typeof rightValue === 'object') {
                            // 递归比较子对象
                            if (ObjectUtils.objectEquals(leftValue, rightValue)) {
                                continue;
                            }
                        }

                        return false;
                    }

                    if (leftValue !== rightValue) {
                        return false;
                    }
                } // end for

                // 所有 keyValue 都比较完毕，返回 true
                return true;

            } else {

                // 一个对象跟另一个非对象无法比较，返回 false
                return false;
            }
        }

        // 基本数据类型比较
        return leftObject === rightObject;
    }

    /**
     * 深度比较两个数组。
     *
     * 如果两个数组均为 undefined，或者均为 null，则它们被视为相等。
     *
     * @param {*} leftArray
     * @param {*} rightArray
     * @returns
     */
    static arrayEquals(leftArray, rightArray) {
        if (leftArray === undefined && rightArray === undefined) {
            return true;
        }

        if (leftArray === undefined || rightArray === undefined) {
            return false;
        }

        if (leftArray === null && rightArray === null) {
            return true;
        }

        if (leftArray === null || rightArray === null) {
            return false;
        }

        if (!Array.isArray(leftArray) || !Array.isArray(rightArray)) {
            return false;
        }

        if (leftArray.length !== rightArray.length) {
            // 两个数组的长度不一致
            return false;
        }

        if (leftArray.length === 0) {
            // 两个数组是空的。
            return true;
        }

        for (let idx = 0; idx < leftArray.length; idx++) {
            let leftValue = leftArray[idx];
            let rightValue = rightArray[idx];

            if (leftValue === undefined) {
                if (rightValue === undefined) {
                    continue;
                }

                return false;
            }

            if (Array.isArray(leftValue)) {
                if (Array.isArray(rightValue)) {
                    if (ObjectUtils.arrayEquals(leftValue, rightValue)) {
                        continue;
                    }
                }

                return false;
            }

            if (leftValue === null) {
                if (rightValue === null) {
                    continue;
                }

                return false;
            }

            if (leftValue instanceof Date) {
                if (rightValue instanceof Date) {
                    if (ObjectUtils.dateEquals(leftValue, rightValue)) {
                        continue;
                    }
                }

                return false;
            }

            if (typeof leftValue === 'object') {
                if (typeof rightValue === 'object') {
                    if (ObjectUtils.objectEquals(leftValue, rightValue)) {
                        continue;
                    }
                }

                return false;
            }

            if (leftValue !== rightValue) {
                return false;
            }
        } // end for

        // 所有元素都比较完毕，返回 true
        return true;
    }

    /**
     * 比较两个 Date 对象。
     *
     * 如果两个对象均为 undefined，或者均为 null，则它们被视为相等。
     *
     * @param {*} leftDate
     * @param {*} rightDate
     * @returns
     */
    static dateEquals(leftDate, rightDate) {
        if (leftDate === undefined && rightDate === undefined) {
            return true;
        }

        if (leftDate === undefined || rightDate === undefined) {
            return false;
        }

        if (leftDate === null && rightDate === null) {
            return true;
        }

        if (leftDate === null || rightDate === null) {
            return false;
        }

        if (leftDate instanceof Date &&
            rightDate instanceof Date) {
            return (leftDate.getTime() === rightDate.getTime());

        } else {
            return false;
        }
    }

    /**
     * 克隆一个 Date 对象。
     *
     * @param {*} sourceDate
     * @returns
     */
    static dateClone(sourceDate) {
        return new Date(sourceDate.getTime());
    }

    /**
     * 并接一个或多个数组的元素到目标数组
     *
     * @param {*} sourceArray
     * @param  {...any} otherArrays
     * @returns 返回新数组
     */
    static arrayConcat(sourceArray, ...otherArrays) {
        let targetArray = sourceArray.slice();
        otherArrays.forEach((array) => {
            targetArray = targetArray.concat(array);
        });
        return targetArray;
    }

    /**
     * 从数组中移除其他数组出现的元素
     *
     * @param {*} sourceArray
     * @param  {...any} otherArrays
     * @returns 返回新数组
     */
    static arraySubtract(sourceArray, ...otherArrays) {
        let targetArray = sourceArray.slice();
        otherArrays.forEach((array) => {
            array.forEach((item) => {
                for (let idx = targetArray.length; idx >= 0; idx--) {
                    if (targetArray[idx] === item) {
                        targetArray.splice(idx, 1);
                    }
                }
            });
        });
        return targetArray;
    }

    /**
     * 向数组添加一个或多个元素
     *
     * @param {*} sourceArray
     * @param  {...any} items
     * @returns 返回新数组
     */
    static arrayAddItems(sourceArray, ...items) {
        let targetArray = sourceArray.slice();
        return targetArray.concat(items);
    }

    /**
     * 从数组里移除一个或多个元素
     *
     * @param {*} sourceArray
     * @param  {...any} items
     * @returns 返回新数组
     */
    static arrayRemoveItems(sourceArray, ...items) {
        let targetArray = sourceArray.slice();
        items.forEach((item) => {
            for (let idx = targetArray.length; idx >= 0; idx--) {
                if (targetArray[idx] === item) {
                    targetArray.splice(idx, 1);
                }
            }
        });
        return targetArray;
    }

    /**
     * 比较两个数组的元素
     *
     * 返回 {addedItems:[], removedItems:[]}
     *
     * "addedItems" 是 rightArray 存在但 leftArray 不存在的元素；
     * "removedItems" 是 leftArray 存在但 rightArray 不存在的元素；
     *
     * @param {*} leftArray
     * @param {*} rightArray
     * @returns
     */
    static arrayDiff(leftArray, rightArray) {
        let addedItems = [];
        let removedItems = [];

        for (let item of rightArray) {
            if (!leftArray.includes(item)) {
                addedItems.push(item);
            }
        }

        for (let item of leftArray) {
            if (!rightArray.includes(item)) {
                removedItems.push(item);
            }
        }

        return {
            addedItems: addedItems,
            removedItems: removedItems
        };
    }

    /**
     * 判断数组是否存在所有指定的值。
     *
     * @param {*} sourceArray
     * @param {*} values
     * @returns
     */
    static arrayIncludesAll(sourceArray, values) {
        for (let value of values) {
            if (!sourceArray.includes(value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 判断数组是否 **不存在** 指定的值。
     *
     * @param {*} sourceArray
     * @param {*} value
     * @returns
     */
    static arrayAbsents(sourceArray, value) {
        return !sourceArray.includes(value);
    }

    /**
     * 判断数组是否 **不存在** 所有指定的值。
     *
     * @param {*} sourceArray
     * @param {*} values
     * @returns
     */
    static arrayAbsentsAll(sourceArray, values) {
        for (let value of values) {
            if (!ObjectUtils.arrayAbsents(sourceArray, value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 通过名称路径（name path）获取对象的属性值。
     *
     * 对于对象:
     * {
     *   foo: {
     *     bar: ...
     *   }
     * }
     *
     * 属性 “foo” 的名称路径为 “foo”，
     * 属性 “bar” 的名称路径为 “foo.bar”，
     *
     * @param {*} sourceObject
     * @param {*} namePath
     * @returns
     */
    static getPropertyValueByNamePath(sourceObject, namePath) {
        let names = namePath.split('.');
        let value = sourceObject;
        while (value !== undefined && names.length > 0) {
            let name = names.shift();
            value = value[name];
        }
        return value;
    }

    /**
     * 判断一个对象是否为空。
     *
     * 当一个纯数据的对象没有自己定义的任何属性时，则视为空对象，即 “{}”
     *
     * @param {*} obj
     * @returns
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    /**
     * 判断一个变量是否为数据对象（“{...}” 对象）
     *
     * @param {*} obj
     * @returns
     */
    static isObject(obj) {
        if (obj === undefined) {
            //
        } else if (Array.isArray(obj)) {
            //
        } else if (obj === null) {
            //
        } else if (obj instanceof Date) {
            //
        } else if (typeof obj === 'object') {
            return true;
        }

        return false;
    }

    /**
     * 从一个对象中删除指定的 keyValue。
     *
     * @param {*} sourceObject
     * @param {*} referenceKeyValues
     * @returns 返回新的对象
     */
    static removePropertiesByKeyValues(sourceObject, referenceKeyValues) {
        // 'referenceKeyValues' 是一个参考对象，比如：
        // {
        //   someKey: soemValue,
        //   ...
        // }
        //
        // 当 sourceObject 出现 key 和 value 都一致的条目时，相应的条目将被删除（delete）

        let clonedSourceObject = ObjectUtils.objectClone(sourceObject);
        let referenceKeys = Object.keys(referenceKeyValues);

        for (let referenceKey of referenceKeys) {
            let referenceValue = referenceKeyValues[referenceKey];
            let sourceValue = clonedSourceObject[referenceKey];

            if (sourceValue === undefined) {
                if (referenceValue === undefined) {
                    delete clonedSourceObject[referenceKey];
                }
                continue;
            }

            if (Array.isArray(sourceValue)) {
                if (Array.isArray(referenceValue) &&
                    ObjectUtils.arrayEquals(sourceValue, referenceValue)) {
                    // 仅当深度比较两个数组相等时，才删除相应的条目
                    delete clonedSourceObject[referenceKey];
                }
                continue;
            }

            if (sourceValue instanceof Date) {
                if (referenceValue instanceof Date &&
                    ObjectUtils.dateEquals(sourceValue, referenceValue)) {
                    delete clonedSourceObject[referenceKey];
                }

                continue;
            }

            if (typeof sourceValue === 'object') {
                if (ObjectUtils.isObject(referenceValue)){
                    // 递归删除子对象当中匹配中的 keyValues
                    let clearObject = ObjectUtils.removePropertiesByKeyValues(sourceValue, referenceValue);
                    if (ObjectUtils.isEmpty(clearObject)) {
                        // 子对象完全相等，删除当前的 key
                        delete clonedSourceObject[referenceKey];

                    } else {
                        // 子对象不完全相等，替换当前 key 的值为已经删除部分 keyValues 的子对象。
                        clonedSourceObject[referenceKey] = clearObject;
                    }
                }
                continue;
            }

            if (sourceValue === referenceValue) {
                // 值为基本数据类型，且值完全相等的条目
                delete clonedSourceObject[referenceKey];
            }
        }

        return clonedSourceObject;
    }

    /**
     * 折叠数组形式的 keyValue 为对象形式的 keyValue
     *
     * 示例：
     * [{key: String, value: String}, ...]
     *
     * 将被折叠成：
     * {key: value, ...}
     *
     * @param {*} items
     * @param {*} keyName
     * @param {*} valueName
     */
    static collapseKeyValueArray(items,
        keyName = 'key', valueName = 'value') {

        let targetObject = {};
        for (let item of items) {
            let key = item[keyName];
            let value = item[valueName];

            targetObject[key] = value;
        }

        return targetObject;
    }

    /**
     * 展开对象形式的 keyValue 为数组形式的 keyValue
     *
     * 示例：
     * {key: value, ...}
     *
     * 将被展开为：
     * [{key: String, value: String}, ...]
     *
     * @param {*} sourceObject
     * @param {*} keyName
     * @param {*} valueName
     */
    static expandKeyValueObject(sourceObject,
        keyName = 'key', valueName = 'value') {
        let items = [];
        for (let key in sourceObject) {
            let item = {};
            item[keyName] = key;
            item[valueName] = sourceObject[key];

            items.push(item);
        }

        return items;
    }

}

module.exports = ObjectUtils;