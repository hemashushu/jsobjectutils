/**
 * 排序条件
 */
class OrderField {
    /**
     *
     * @param {*} fieldName 待排序的（项目对象的）属性名称
     * @param {*} isAscendingOrder 是否正序排序
     */
	constructor(fieldName, isAscendingOrder = true) {
		this.fieldName = fieldName;
		this.isAscendingOrder = isAscendingOrder;
	}
}

module.exports = OrderField;