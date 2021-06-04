class ObjectAccessor {
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
     * @param {*} namePath 名称路径，
     *     注：如果属性名称当中含有特殊字符，比如逗号，点号，空格等，**需要**
     *     前后加单引号或双引号，必要时还要作转义，详细见 splitNamePath
     *     方法的说明。
     * @returns
     */
     static getPropertyValueByNamePath(sourceObject, namePath) {
        let names = ObjectAccessor.splitNamePath(namePath); // 不能简单地使用 String.split('.') 函数分割
        let value = sourceObject;
        while (value !== undefined && names.length > 0) {
            let name = names.shift();
            value = Object.keys(value).includes(name) ? value[name] : undefined;
        }
        return value;
    }

    /**
     * 分割名称路径
     *
     * 名称路径（Name path）是一个使用点号（.）把多个属性名相连的字符串，比如
     * 'foo.bar.hello'
     *
     * 上面的名称路径将会被分割为：['foo','bar','hello']
     *
     * - 当属性名含有点号（.）时，需要把属性名使用单引号或双引号包括起来，比如 'foo.bar'， "foo.bar"
     * - 当属性名含双引号时，需要把属性名使用单引号包括起来，比如 'foo "m" bar'
     * - 当属性名含有单引号时
     *   + 如果属性使用单引号包括起来，则使用两个（连续的）单引号表示一个单引号，比如 'it''s number' 表示 it's number
     *   + 如果属性使用双引号包括起来，则直接书写单引号即可，比如 "it's number"
     * - 当属性名含有空格以及其他特殊符号时，建议使用单引号或双引号包括起来，比如 'foo# hello, bar!', "foo# hello, bar!"
     *
     * @param {*} namePath
     * @returns 返回属性名称数组
     */
    static splitNamePath(namePath) {
        let names = [];
        let nameBuffer = [];
        let state = 'expect-name-start';

        for(let idx=0; idx<namePath.length; idx++) {
            let c = namePath[idx];

            switch(state) {
                case 'expect-name-start':
                    {
                        // if (c === ' '){
                        //     continue;
                        // }else
                        if (c === '"') {
                            nameBuffer = [];
                            state = 'expect-double-quote-end';
                        }else if (c === '\'') {
                            nameBuffer = [];
                            state = 'expect-single-quote-end';
                        }else {
                            nameBuffer = [];
                            nameBuffer.push(c);
                            state = 'expect-name-end';
                        }
                        break;
                    }

                case 'expect-double-quote-end':
                    {
                        if (c === '"') {
                            let name = nameBuffer.join('');
                            names.push(name);
                            state = 'expect-dot';
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-single-quote-end':
                    {
                        if (c === '\'') {
                            if (idx + 1 < namePath.length &&
                                namePath[idx+1] === '\'') {
                                // 单引号之内有两个连续单引号，表示一个单引号字符的意思
                                nameBuffer.push('\'');
                                idx+=1;
                            }else {
                                // 当前是结束单引号
                                let name = nameBuffer.join('');
                                names.push(name);
                                state = 'expect-dot';
                            }
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-name-end':
                    {
                        if (c==='.') {
                            let name = nameBuffer.join('');
                            //names.push(name.trim());
                            names.push(name);
                            state = 'expect-name-start';
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-dot':
                {
                    if (c==='.') {
                        state = 'expect-name-start';
                    }
                    // else if (c === ' ') {
                    //     continue;
                    // }
                    else {
                        // 语法错误
                        return names;
                    }
                    break;
                }
            }
        }

        if (state === 'expect-name-end' && nameBuffer.length > 0) {
            let name = nameBuffer.join('');
            names.push(name);
        }

        return names;
    }
}

module.exports = ObjectAccessor;