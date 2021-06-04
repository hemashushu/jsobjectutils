class ObjectComposer {

    /**
     * 分割属性名称序列
     *
     * 属性名称字符串是一个使用逗号（,）把多个属性名相连的字符串，比如
     * 'id, name, addr'
     *
     * 上面的名称路径将会被分割为 ['id', 'name', 'addr']
     *
     * - 当属性名含有逗号（,）时，需要把属性名使用单引号或双引号包括起来，比如 'foo,bar'， "foo,bar"
     * - 当属性名含双引号时，需要把属性名使用单引号包括起来，比如 'foo "m" bar'
     * - 当属性名含有单引号时
     *   + 如果属性使用单引号包括起来，则使用两个（连续的）单引号表示一个单引号，比如 'it''s number' 表示 it's number
     *   + 如果属性使用双引号包括起来，则直接书写单引号即可，比如 "it's number"
     * - 当属性名含有空格以及其他特殊符号时，建议使用单引号或双引号包括起来，比如 'foo# hello. bar!', "foo# hello. bar!"
     *
     * @param {*} nameString
     * @returns 返回属性名称数组
     */
     static splitProperityNameSequence(nameString) {
        let names = [];
        let nameBuffer = [];
        let state = 'expect-name-start';

        for(let idx=0; idx<nameString.length; idx++) {
            let c = nameString[idx];

            switch(state) {
                case 'expect-name-start':
                    {
                        if (c === ' '){
                            continue;
                        }else
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
                            state = 'expect-comma';
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-single-quote-end':
                    {
                        if (c === '\'') {
                            if (idx + 1 < nameString.length &&
                                nameString[idx+1] === '\'') {
                                // 单引号之内有两个连续单引号，表示一个单引号字符的意思
                                nameBuffer.push('\'');
                                idx+=1;
                            }else {
                                // 当前是结束单引号
                                let name = nameBuffer.join('');
                                names.push(name);
                                state = 'expect-comma';
                            }
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-name-end':
                    {
                        if (c===',') {
                            let name = nameBuffer.join('');
                            name = name.trim();
                            names.push(name);
                            state = 'expect-name-start';
                        }else {
                            nameBuffer.push(c);
                        }
                        break;
                    }

                case 'expect-comma':
                {
                    if (c===',') {
                        state = 'expect-name-start';
                    } else if (c === ' ') {
                        continue;
                    }
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
            name = name.trim();
            names.push(name);
        }

        return names;
    }

    /**
     * 根据指定的属性名称重组对象。
     *
     * - 即只挑选指定名称的属性构成一个新的对象。
     * - 如果原对象不存在指定的属性，则该属性值为 undefined。
     *
     * @param {*} sourceObject
     * @param {*} propertyNames 属性名称数组，
     *     注：如果属性名称当中含有特殊字符，比如逗号，点号，空格等，**不需要**
     *     前后加单引号或双引号，也不用任何的转换或者转义。
     * @returns 返回只由指定属性所构成的新对象
     */
    static compose(sourceObject, propertyNames) {
        let targetObject = {};
        for(let propertyName of propertyNames) {
            targetObject[propertyName] = sourceObject[propertyName];
        }
        return targetObject;
    }

    /**
     * 根据指定的属性名称序列重组对象。
     *
     * @param {*} sourceObject
     * @param {*} nameString 一个字符串，由逗号分隔的属性名称序列
     *     注：如果属性名称当中含有特殊字符，比如逗号，点号，空格等，**需要**
     *     前后加单引号或双引号，必要时还要作转义，详细见 splitProperityNameSequence
     *     方法的说明。
     * @returns 返回只由指定属性所构成的新对象
     */
    static composeByProperityNameSequence(sourceObject, nameString) {
        let propertyNames = ObjectComposer.splitProperityNameSequence(nameString);
        return ObjectComposer.compose(sourceObject, propertyNames);
    }

}

module.exports = ObjectComposer;