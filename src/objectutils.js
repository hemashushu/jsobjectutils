class ObjectUtils {

    /**
     * 合并两个对象
     *
     * sourceObject 的所有 keyValue 会被直接复制到 targetObject（输出对象），而
     * defaultObject 的 keyValue 仅当 source 对象不存在相应的 key 时，才被
     * 复制到 targetObject。
     *
     * @param {*} sourceObject 源对象
     * @param {*} defaultObject 默认对象
     * @param {*} keyValueModifyFuncs 值修改方法
     * @param {*} _internalKeyNamePath 方法内部使用的参数，外部调用者可忽略
     * @returns
     */
    static objectMerge(sourceObject, defaultObject, keyValueModifyFuncs, _internalKeyNamePath) {

        let targetObject = {};

        // valueModifyFunc 是一个值修改方法的映射（Map），结构如下:
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

            // 构建当前 key 的名称路径（name path）
            let currentKeyNamePath = (_internalKeyNamePath === undefined) ?
                sourceObjectKey : _internalKeyNamePath + '.' + sourceObjectKey;

            if (keyValueModifyFuncs !== undefined) {
                let keyValueModifyFunc = keyValueModifyFuncs[currentKeyNamePath];
                if (keyValueModifyFunc !== undefined) {
                    // 添加经过修改方法返回的新值
                    targetObject[sourceObjectKey] = keyValueModifyFunc(sourceValue);
                    continue;
                }
            }

            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray

            if (Array.isArray(sourceValue)) {
                // 源值是一个数组
                targetObject[sourceObjectKey] = ObjectUtils.arrayClone(sourceValue, keyValueModifyFuncs, currentKeyNamePath);

            } else if (sourceValue === null) {
                // 源值为 null

                // null 也被视为一种存在的值，以防止被 defaultObject 覆盖。
                targetObject[sourceObjectKey] = null;

            } else if (sourceValue instanceof Date) {
                // 源值为一个 Date 对象，因为使用 typeof 方法返回的也是 'object'，所以需要单独复制它。
                targetObject[sourceObjectKey] = ObjectUtils.dateClone(sourceValue);

            } else if (typeof sourceValue === 'object') {
                // 源值是一个对象

                let defaultValue = defaultObject[sourceObjectKey];

                if (defaultObjectKeys.indexOf(sourceObjectKey) >= 0 &&
                    !(defaultValue instanceof Date) &&
                    typeof defaultValue === 'object') {
                    // 源值和默认值都是一个对象，需要进行深层合并
                    targetObject[sourceObjectKey] = ObjectUtils.objectMerge(
                        sourceValue, defaultValue, keyValueModifyFuncs, currentKeyNamePath);
                } else {
                    // 在默认对象里不存在相应的 key，或者虽然存在，但不是相同的 'object'
                    // 类型，这种情况下，只能直接 clone 源值而丢弃默认值（假如存在的话）。
                    targetObject[sourceObjectKey] = ObjectUtils.objectClone(sourceValue, keyValueModifyFuncs, currentKeyNamePath);
                }

            } else {
                // 源值可能是一些基本数据类型
                targetObject[sourceObjectKey] = sourceValue;
            }
        }

        // 接下来复制仅存在于 default 对象的 keyValue。
        for (let defaultObjectKey of defaultObjectKeys) {

            if (sourceObjectKeys.indexOf(defaultObjectKey) >= 0) {
                // 跳过 sourceObject 已存在的 keyValue
                continue;
            }

            let defaultValue = defaultObject[defaultObjectKey];

            let currentKeyNamePath = (_internalKeyNamePath === undefined) ?
                defaultObjectKey : _internalKeyNamePath + '.' + defaultObjectKey;

            if (defaultValue === undefined) {
                // 跳过值为 undefined 的 keyValue

            } else if (Array.isArray(defaultValue)) {
                // 默认值是一个 Array
                targetObject[defaultObjectKey] = ObjectUtils.arrayClone(
                    defaultValue, keyValueModifyFuncs, currentKeyNamePath);

            } else if (defaultValue === null) {
                // 默认值是 null
                // null 也被视为一种存在的值，复制到 targetObject，以防止该 keyValue 在将来的 objectMerge 时被默认值覆盖。
                targetObject[defaultObjectKey] = null;

            } else if (defaultValue instanceof Date) {
                // 默认值为一个 Date 对象，因为使用 typeof 方法返回的也是 'object'，所以需要单独复制它。
                targetObject[defaultObjectKey] = ObjectUtils.dateClone(defaultValue);

            } else if (typeof defaultValue === 'object') {
                // 默认值是一个对象
                targetObject[defaultObjectKey] = ObjectUtils.objectClone(defaultValue, keyValueModifyFuncs, currentKeyNamePath);

            } else {
                targetObject[defaultObjectKey] = defaultValue;
            }
        }

        return targetObject;
    }

    /**
     *
     * 合并两个数组
     *
     * 当前只支持比较/合并数组中数据类型为 **字符串、数字、Date 等类型** 的元素，其他
     * 数据类型的元素因为无法跟数组中已存在的元素进行比较，所以它们将被直接 clone。
     *
     * 比如 [2,3,4] 和 [3,4,5] 将合并成为 [2,3,4,5]
     *
     * @param {*} sourceArray
     * @param {*} defaultArray
     * @param {*} keyValueModifyFuncs
     * @param {*} _internalKeyNamePath
     * @returns
     */
    static arrayMerge(sourceArray, defaultArray, keyValueModifyFuncs, _internalKeyNamePath) {

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

        let currentKeyNamePath = (_internalKeyNamePath === undefined) ?
            '[]' : _internalKeyNamePath + '.' + '[]';

        // deep clone 一份源数组，当应用于不需要态严谨的场合时，也可以使用 sourceArray.slice() 进行浅 clone
        let targetArray = ObjectUtils.arrayClone(sourceArray, keyValueModifyFuncs, _internalKeyNamePath);

        let sourceArrayLength = sourceArray.length;

        for (let defaultValue of defaultArray) {
            if (defaultValue === undefined) {
                // 跳过值为 undefined 的元素

            } else if (Array.isArray(defaultValue)) {
                // 默认值为 Array。
                // 因为无法与已存在的元素进行比较，故直接 clone。
                targetArray.push(ObjectUtils.arrayClone(defaultValue, keyValueModifyFuncs, currentKeyNamePath));

            } else if (defaultValue === null) {
                // 默认值为 NULL。
                // 因为无法与已存在的元素进行比较，故直接 clone。
                targetArray.push(null);

            } else if (defaultValue instanceof Date) {
                // 默认值为 Date 类型数据，先进行比较再决定是否 clone。
                let ms = defaultValue.getTime();
                let found = false;
                for (let idx = 0; idx < sourceArrayLength; idx++) {
                    if (targetArray[idx] instanceof Date &&
                        targetArray[idx].getTime() === ms) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    targetArray.push(
                        ObjectUtils.dateClone(defaultValue));
                }

            } else if (typeof defaultValue === 'object') {
                // 默认值是一个对象
                targetArray.push(
                    ObjectUtils.objectClone(defaultValue, keyValueModifyFuncs, currentKeyNamePath));

            } else if (
                // 'string' 和 'number' 先进行比较，然后再决定是否添加到 targetArray
                typeof defaultValue === 'string' ||
                typeof defaultValue === 'number') {

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
     * @param {*} _internalKeyNamePath
     * @returns
     */
    static objectClone(sourceObject, keyValueModifyFuncs, _internalKeyNamePath) {
        return ObjectUtils.objectMerge(sourceObject, {}, keyValueModifyFuncs, _internalKeyNamePath);
    }

    /**
     * 数组的深度克隆
     *
     * @param {*} sourceArray
     * @param {*} keyValueModifyFuncs
     * @param {*} _internalKeyNamePath
     * @returns
     */
    static arrayClone(sourceArray, keyValueModifyFuncs, _internalKeyNamePath) {
        let currentKeyNamePath = (_internalKeyNamePath === undefined) ?
            '[]' : _internalKeyNamePath + '.' + '[]';

        let targetArray = [];
        for (let item of sourceArray) {
            if (Array.isArray(item)) {
                targetArray.push(ObjectUtils.arrayClone(
                    item, keyValueModifyFuncs, currentKeyNamePath));

            } else if (item === null) {
                targetArray.push(null);

            } else if (item instanceof Date) {
                targetArray.push(ObjectUtils.dateClone(item));

            } else if (typeof item === 'object') {
                targetArray.push(
                    ObjectUtils.objectClone(item, keyValueModifyFuncs, currentKeyNamePath));

            } else {
                targetArray.push(item);
            }
        }

        return targetArray;
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
     * Get property value by name path.
     *
     * The name path can contains dot symbol, such as 'one.two' will get the
     * property 'two' of the sub-object 'one'.
     *
     * Return undefined if the specified name path does not exists.
     *
     * @param  {[type]} obj      [description]
     * @param  {[type]} namePath [description]
     * @return {[type]}          [description]
     */

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
     * @param {*} obj
     * @param {*} namePath
     * @returns
     */
    static getPropertyValueByNamePath(obj, namePath) {
        let names = namePath.split('.');
        let value = obj;
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
     * 判断一个变量是否为 “{...}” 对象
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
        // 当 sourceObject 出现 someKey 时，相应的条目将被删除（delete）

        let clonedSourceObject = ObjectUtils.objectClone(sourceObject);
        let referenceKeys = Object.keys(referenceKeyValues);

        for (let referenceKey of referenceKeys) {
            let sourceValue = clonedSourceObject[referenceKey];
            let referenceValue = referenceKeyValues[referenceKey];

            if (sourceValue === undefined) {
                // sourceObject 不存在指定的 referenceKey，跳过
                continue;
            }

            if (Array.isArray(sourceValue) && Array.isArray(referenceValue)) {
                if (ObjectUtils.arrayEquals(sourceValue, referenceValue)) {
                    // 仅当深度比较两个数组相等时，才删除相应的条目
                    delete clonedSourceObject[referenceKey];
                }

            } else if (typeof sourceValue === 'object' && typeof referenceValue === 'object') {
                // 递归删除子对象的 keyValues

                let clearObject = ObjectUtils.removePropertiesByKeyValues(sourceValue, referenceValue);
                if (ObjectUtils.isEmpty(clearObject)) {
                    // 删除空的对象
                    delete clonedSourceObject[referenceKey];
                } else {
                    clonedSourceObject[referenceKey] = clearObject;
                }

            } else if (sourceValue === referenceValue) {
                // 值完全相等时才删除相应的条目
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

    /**
     * 挑选对象中指定名称的 keyValues 并形成一个新的对象
     *
     * @param {*} sourceObject
     * @param {*} keys
     */
    static pickUpKeyValues(sourceObject, keys) {
        let targetObject = {};
        for (let key of keys) {
            targetObject[key] = sourceObject[key];
        }

        return targetObject;
    }
}

module.exports = ObjectUtils;