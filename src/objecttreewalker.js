const defaultChildPropertyName = 'children';

/**
 * 层叠式对象的元素查找工具
 *
 * 有时一组同类型的对象并不是以数组的形式储存，而是以树状的形式储存。
 * 比如有一类对象有一个名为 children 属性，该属性是一个数组，包含了一组子
 * 对象，而子对象跟该对象是同类型的，即子对象也有 children 属性。比如：
 *
 * Section 对象的结构:
 * {
 *     name: string,
 *     children: [Section, ...]
 * }
 *
 * 如上即为层叠式对象。
 */
class ObjectTreeWalker {

    /**
     * 使用对象的属性名和指定的值构建一个 matchFunc 方法。
     *
     * matchFunc 方法供 findChild/findNextSibling/findPreviousSibling 等
     * 方法使用。
     *
     * @param {*} propName
     * @param {*} value
     * @returns
     */
    static propMatchFunc(propName, value) {
        return (obj) => {
            return obj[propName] === value;
        };
    }

    /**
     * 寻找层叠式对象之中的某个子对象
     *
     * @param {*} cascadedObject 目标对象
     * @param {*} matchFunc 判断是否所查找的子对象的方法，方法签名为：
     *     matchFunc(child){ return true/false;}
     * @param {*} childPropName 包含子对象数组的属性的名称
     * @returns 返回指定的子对象，如果没找到则返回 undefined
     */
    static findChild(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        let result = ObjectTreeWalker._findChild(cascadedObject, matchFunc, childPropName);
        if (result !== undefined) {
            return result.item;
        }
    }

    // 返回 {items, index, item}
    static _findChild(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        let findInto = (parent) => {
            let children = parent[childPropName];
            for (let idx = 0; idx < children.length; idx++) {
                let child = children[idx];
                if (matchFunc(child)) {
                    return {
                        items: children,
                        index: idx,
                        item: child
                    };
                } else {
                    let found = findInto(child);
                    if (found !== undefined) {
                        return found;
                    }
                }
            }
        };

        return findInto(cascadedObject);
    }

    /**
     * 查找一组对象当中的下一个对象。
     *
     * @param {*} items
     * @param {*} targetItemMatchFunc
     * @returns 返回下一个对象。
     *     - 如果指定对象不存在则返回 undefined，
     *     - 如果指定对象已经是最后一个元素，则返回 null。
     */
    static findNextSibling(items, targetItemMatchFunc) {
        let idx = items.findIndex(item => {
            return targetItemMatchFunc(item);
        });

        if (idx === -1) {
            return;
        }

        return ObjectTreeWalker.findNextSiblingByIndex(items, idx);
    }

    static findNextSiblingByIndex(items, index) {
        if (index >= items.length - 1) {
            return null;
        }

        return items[index + 1];
    }

    /**
     * 查找一组对象当中的前一个对象。
     *
     * @param {*} items
     * @param {*} targetItemMatchFunc
     * @returns 返回上一个对象。
     *     - 如果指定对象不存在则返回 undefined，
     *     - 如果指定对象已经是第一个元素，则返回 null。
     */
    static findPreviousSibling(items, targetItemMatchFunc) {
        let idx = items.findIndex(item => {
            return targetItemMatchFunc(item);
        });

        if (idx === -1) {
            return;
        }

        return ObjectTreeWalker.findPreviousSiblingByIndex(items, idx);
    }

    static findPreviousSiblingByIndex(items, index) {
        if (index <= 0) {
            return null;
        }

        return items[index - 1];
    }

    /**
     * 寻找层叠式对象之中的某个子对象的同级下一个对象
     *
     * @param {*} cascadedObject
     * @param {*} matchFunc
     * @param {*} childPropName
     * @returns 返回同级下一个对象
     *     - 返回 undefined 如果指定的子对象没找到
     *     - 返回 null 如果已经是最后一个对象
     */
    static findNextSiblingInCascadedObject(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        let result = ObjectTreeWalker._findChild(cascadedObject, matchFunc, childPropName);
        if (result === undefined) {
            return;
        }

        let { items, index } = result;
        return ObjectTreeWalker.findNextSiblingByIndex(items, index);
    }

    /**
     * 寻找层叠式对象之中的某个子对象的同级前一个对象
     *
     * @param {*} cascadedObject
     * @param {*} matchFunc
     * @param {*} childPropName
     * @returns 返回同级前一个对象
     *     - 返回 undefined 如果指定的子对象没找到
     *     - 返回 null 如果已经是最后一个对象
     */
    static findPreviousSiblingInCascadedObject(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        let result = ObjectTreeWalker._findChild(cascadedObject, matchFunc, childPropName);
        if (result === undefined) {
            return;
        }

        let { items, index } = result;
        return ObjectTreeWalker.findPreviousSiblingByIndex(items, index);
    }

    /**
     * 将层叠式对象平板化
     *
     * @param {*} cascadedObject
     * @param {*} childPropName
     * @returns 返回一个数组，元素是层叠式对象的所有子节点，
     *     类似一个完全展开的文件目录树，顺序是从上往下排列。
     */
    static flatten(cascadedObject, childPropName = defaultChildPropertyName) {
        let allChildren = [];

        let findInto = (parent) => {
            allChildren.push(parent);

            let children = parent[childPropName];
            for (let child of children) {
                findInto(child);
            }
        };

        findInto(cascadedObject);
        return allChildren;
    }

    /**
     * 寻找层叠式对象所有节点中，跟指定节点相邻的下一个节点。
     *
     * @param {*} cascadedObject
     * @param {*} matchFunc
     * @param {*} childPropName
     * @returns 返回相邻的下一个节点。
     *     - 返回 undefined 如果指定的子对象没找到
     *     - 返回 null 如果已经是最后一个对象
     */
    static findNextChild(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        /**
         * 一般的寻找方法是：
         * 1. 寻找同级的下一个节点
         * 1.1 如果存在下一个节点，且无子节点，则返回该节点
         * 1.2 如果存在下一个节点，且有子节点，则寻找该层之内所有层子节点的第一个节点
         * 2. 如果不存在下一个节点，则返回上一层，寻找父层同级的下一个节点
         * 3. 跳到 1.1
         *
         * 这个方法需要节点有一个指向父节点的 'parent' 属性，当前方法的实现假设没有
         * 这样的属性，且为简化代码，采用平板化所有节点再寻找的方法。
         * 当前方法效率较低，勿用于需要频繁计算或者节点数量多的场合。
         *
         */

        let items = ObjectTreeWalker.flatten(cascadedObject, childPropName);
        return ObjectTreeWalker.findNextSibling(items, matchFunc);
    }

    /**
     * 寻找层叠式对象所有节点中，跟指定节点相邻的前一个节点。
     *
     * @param {*} cascadedObject
     * @param {*} matchFunc
     * @param {*} childPropName
     * @returns 返回相邻的前一个节点。
     *     - 返回 undefined 如果指定的子对象没找到
     *     - 返回 null 如果已经是最后一个对象
     */
    static findPreviousChild(cascadedObject, matchFunc, childPropName = defaultChildPropertyName) {
        /**
         * 一般的寻找方法是：
         * 1. 寻找同级的前一个节点
         * 1.1 如果存在前一个节点，且无子节点，则返回该节点
         * 1.2 如果存在前一个节点，且有子节点，则寻找该层之内所有层子节点的最后一个节点
         * 2. 如果不存在前一个节点，则返回上一层，寻找父层同级的前一个节点
         * 3. 跳到 1.1
         *
         * 这个方法需要节点有一个指向父节点的 'parent' 属性，当前方法的实现假设没有
         * 这样的属性，且为简化代码，采用平板化所有节点再寻找的方法。
         * 当前方法效率较低，勿用于需要频繁计算或者节点数量多的场合。
         *
         */

        let items = ObjectTreeWalker.flatten(cascadedObject, childPropName);
        return ObjectTreeWalker.findPreviousSibling(items, matchFunc);
    }
}

module.exports = ObjectTreeWalker;