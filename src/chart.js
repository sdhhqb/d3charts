// 图表模块库
define(function (require) {
	var self = {};

	var _chartLibrary = {};		//图表库

	/**
	 * 定义图表模块
	 * @param {[type]} name  [description]
	 * @param {[type]} chart [description]
	 */
	self.set = function (name, chart) {
		_chartLibrary[name] = chart;
		return self;
	}

	/**
	 * 获取图表模块
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	self.get = function (name) {
		return _chartLibrary[name];
	}
	
	return self;
});