class ObjectCompressor {

    /**
     * 压缩一个数据对象到一个数组。
     *
     * 数据对象是一组 key-value 对，当需要储存对象到文件（或者
     * 想要通过网络传输）对象数组时，因为对象的 key 信息是重复的，所以
     * 可以通过把对象通过某种规则转换为只有 value 的数组，以此达到节省
     * 空间（节省传输量）的目的。
     *
     * ObjectUtils.compress 方法接受两个参数，第一个参数是待压缩的对象实例，
     * 第二个参数是压缩的“模板（template）”，即对象的 key 与 value 数组之间
     * 的顺序对应关系。
     *
     * 一般情况下，template 是一个 key 的字符串数组，用于表示 key 的顺序，当
     * 目标对象有多层结构时，此时子对象的 key 对应的 template 是一个对象：
     * {
     *   name: 'keyName',
     *   type: 'object|array',
     *   keys: ['childKeyName1', 'childKeyName2',...]
     * }
     *
     * ## 示例 1
     *
     * 有对象：
     * {
     *   "id":123,
     *   "name":"yang"
     * }
     *
     * 使用下面 template 压缩：
     * ['id', 'name']
     *
     * 得到：
     * [123, 'yang']
     *
     * ## 示例 2
     *
     * 对象中包含基本类型（primitive data type）的数组
     * {
     *   "id":123,
     *   "name":"yang",
     *   "tags":["foo", "bar"]
     * }
     *
     * about the Primitive data type:
     * https://developer.mozilla.org/en-US/docs/Glossary/Primitive
     *
     * 使用下面 template 压缩：
     * ['id', 'name', 'tags']
     *
     * 得到：
     * [123, 'yang', ["foo", "bar"]]
     *
     * ## 示例 3
     *
     * 如果模板中指定的 key 在对象中不存在，则 undefined 会被添加到输出数组中，
     * 用于占位，比如上例的对象如果使用下面 template 压缩：
     * ['id', 'name', 'addr', 'tags']
     *
     * 则会得到：
     * [123, "yang", undefined, ["foo", "bar"]]
     *
     * ## 示例 4
     *
     * 如果对象包含子对象，比如：
     *
     * {
     *   "id": 123,
     *   "name": "yang",
     *   "addr": {
     *     "street":"1st Rd",
     *     "city":"Shenzhen"
     *   }
     * }
     *
     * 使用下面 template 压缩：
     * ['id', 'name', {name: 'addr', keys: ['street', 'city']}]
     *
     * 注意第 3 个元素，它并不是一个字符串，而是一个仅包含一个 key-value 对
     * 的对象。
     *
     * 得到：
     * [123, 'yang', ["1st Rd", "Shenzhen"]]
     *
     * 为了易于阅读，上面的 template 可以写成多行：
     * [
     *   'id',
     *   'name',
     *   {
     *      name: 'addr',
     *      keys: [
     *       'street',
     *       'city'
     *      ]
     *   }
     * ]
     *
     * ## 示例 5
     *
     * 如果对象数组，而数组的元素数据类型是数据对象，比如：
     * {
     *   "id": 123,
     *   "name": "yang",
     *   "addr": [{
     *       "street":"1st Rd",
     *       "city":"Shenzhen"
     *     },
     *       "street":"2st Rd",
     *       "city":"Guangzhou"
     *     }]
     * }
     *
     * 对应的 template 应该是：
     *
     * [
     *   'id',
     *   'name',
     *   {
     *      name: 'addr',
     *      type: 'array',
     *      keys: [
     *       'street',
     *       'city'
     *      ]
     *   }
     * ]
     *
     * 注意跟示例 4 的 template 对比，其实只是多了 type: 'array' 这一项。
     *
     * ## undefined 与 null
     *
     * 如果要将压缩后得到的目标数组储存到文件，需要使用 JSON.stringify(data) 方法
     * 将它转换为字符串，这个方法会把 undefined 元素自动替换为 null，比如：
     * [123, "yang", undefined, ["foo", "bar"]]
     *
     * 会被自动替换为：
     * [123, "yang", null, ["foo", "bar"]]
     *
     * 于是，当使用 ObjectUtils.decompress() 方法解压目标数组时，有可能将会得到跟原始对象
     * 不一致的对象，所以建议在 compress 一个/一组对象时，最好先将所有可能值为 undefined
     * 的属性设计成允许 null 值的。即在判断一个属性值时，不应仅仅判断它是否为 undefined，
     * 还要同时判断是否为 null，比如：
     *
     * if (obj.addr !== undefined && obj.addr !== null) {
     *     ...
     * }
     *
     * @param {*} obj
     * @param {*} template 对象压缩模板
     * @returns 返回一个数组
     */
     static compress(obj, template) {
        let data = []; // 目标数组

        for (let key of template) {
            if (typeof key === 'string') {
                // - 属性值为普通数据类型
                // - 属性值为基本数据类型的数组
                // - 如果属性不存在，则 undefined 会被添加到目标数组
                data.push(obj[key]);

            } else if (typeof key === 'object') {
                // - 属性值为子对象
                // - 属性值为对象类型的数组
                // - 如果属性不存在，则 undefined 会被添加到目标数组
                // - key 对象的结构：
                //   {name: 'keyName',
                //    type: 'array|object',
                //    keys: ['childKeyName1', 'childKeyName2',...]
                //   }

                let value = obj[key.name];

                if (value === undefined) {
                    data.push(undefined);
                    continue;
                }

                let childKeys = key.keys; // 子对象的 template
                if (key.type === 'array') {
                    data.push(ObjectCompressor.compressArray(value, childKeys));
                } else {
                    data.push(ObjectCompressor.compress(value, childKeys));
                }
            }
        }

        return data;
    }

    /**
     * 压缩对象数组
     *
     * @param {*} objs 对象数组
     * @param {*} template
     * @returns 返回一个数组的数组
     */
    static compressArray(objs, template) {
        let datas = [];
        for (let item of objs) {
            datas.push(ObjectCompressor.compress(item, template));
        }
        return datas;
    }

    /**
     * 解压一个数组。
     *
     * 用于还原 ObjectUtils.compress() 压缩而得的数组。
     *
     * ## 示例 1
     *
     * 如有如下数组：
     * [123, "yang"]
     *
     * 使用如下 template 解压：
     * ['id', 'name']
     *
     * 将会得到对象：
     * {
     *   "id": 123,
     *   "name": "yang"
     * }
     *
     * ## 示例 2
     *
     * 解压时的模板必须跟压缩时的保持一致，即模板（一个数组）中的元素的
     * 个数、顺序都必须保持一致。有时因为软件的更新迭代，如果在后来的版本中：
     * - 对象增加了新的属性，则必须保证新的属性要放在模板的末尾，比如
     *   ['id', 'name']
     *   后来增加了 'addr' 属性，则新模板应该为
     *   ['id', 'name', 'addr']
     *   切忌不要把 'addr' 元素放在第 0 或者 第 1 个位置。
     * - 对象删除了属性，则必须保证模板（压缩模板同时也是解压模板）仍保留
     *   那个被删除的属性的元素，比如：
     *   ['id', 'name', 'addr']
     *   后来删除了 'name' 属性，则新模板仍然需要保留 'name' 元素，以保证
     *   解压已有的数组时，属性的位置的正确。当然 'name' 可以改名为其他无意义
     *   的字符串，比如 'deleted001'，因为它仅仅起占位对齐作用。
     *
     * 如有如下数组：
     * [123, "yang"]
     *
     * 使用如下 template 解压：
     * ['id', 'name', 'addr']
     *
     * 将得到对象：
     * {
     *   "id": 123,
     *   "name": "yang"
     *   "addr": undefined
     * }
     *
     * 这种情况常发生在使用新的模板（对象新增加了属性）解压已有的压缩数据时，
     * 即，模板的元素数量超出了数组的元素数量，超出的属性值通通被设置为 undefined.
     *
     * ## 示例 3
     *
     * 如有如下数组：
     * [123, 'yang', 'Shenzhen']
     *
     * 使用如下 template 解压：
     * ['id', 'name']
     *
     * 将会得到对象：
     * {
     *   "id": 123,
     *   "name": "yang"
     * }
     *
     * 即，模板元素的属性比数组的元素数量少，因为模板的元素决定了目标对象的属性名称、个数，
     * 所以数组多出来的元素自然就被忽略了，这种情况一般是因为模板在维护过程中出错了，即
     * 模板的元素应该只能 “增加”，而不能 ”减少“，当然顺序也是不能更改的。
     *
     * ## undefined 与 null
     *
     * 解压时会自动把数组中值为 null 的属性值设置为 undefined，因为 null 使用场合比较少，
     * 以此简化因 JSON.stringify(data) 方法 undefined 自动转成 null 造成的问题。
     * 不过程序仍然要同时判断属性值是否为 undefined 和 null。
     *
     * @param {*} data 数组
     * @param {*} template 对象压缩模板
     * @returns 返回一个对象
     */
    static decompress(data, template) {
        let obj = {};

        // data 是一个数组，如果数组的元素数量比模板的元素数量还多，则
        // 多出来的元素直接被忽略，解压时仅以模板的元素为准。

        for (let idx = 0; idx < template.length; idx++) {

            let key = template[idx];

            // 如果模板的元素数量比数组的元素数量还多，则超出数组部分的
            // 的属性值被设置为 undefined.
            if (idx >= data.length) {
                obj[key] = undefined;
                continue;
            }

            if (typeof key === 'string') {
                let value = data[idx];

                if (value === null) {
                    // 自动转换 null 为 undefined，因为储存压缩数组时，
                    // JSON.stringify(data) 方法会把 undefined 自动转成 null，
                    // 以此简化还原过程。需注意如果原始对象的属性值为 null，也会被
                    // 转为 undefined，所以压缩/解压的使用者需要同时判断属性值是否为
                    // undefined 和 null。
                    value = undefined;
                }

                obj[key] = value;

            } else if (typeof key === 'object') {
                // 子对象，或者元素是对象类型的数组
                let value = data[idx];

                if (value === null || value === undefined) {
                    obj[key.name] = undefined;
                    continue;
                }

                let childKeys = key.keys; // 子对象的 template
                if (key.type === 'array') {
                    obj[key.name] = ObjectCompressor.decompressArray(value, childKeys);
                } else {
                    obj[key.name] = ObjectCompressor.decompress(value, childKeys);
                }
            }
        }
        return obj;
    }

    /**
     * 解压一个数组的数组。
     *
     * @param {*} datas
     * @param {*} template
     * @returns
     */
    static decompressArray(datas, template) {
        let objs = [];
        for (let data of datas) {
            objs.push(ObjectCompressor.decompress(data, template));
        }
        return objs;
    }
}

module.exports = ObjectCompressor;