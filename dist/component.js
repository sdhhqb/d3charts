// 组件模块库
define(function (require) {
	var self = {};

	var _componentLibrary = {};		//组件库

	/**
	 * 定义组件模块
	 * @param {[type]} name      [description]
	 * @param {[type]} component [description]
	 */
	self.set = function (name, component) {
		_componentLibrary[name] = component;
		return self;
	}

	/**
	 * 获取组件模块
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	self.get = function (name) {
		return _componentLibrary[name];
	}

	return self;
});