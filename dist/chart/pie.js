// 饼状模块
define(function (require) {
	var Pie = {
		x: 2,
		info: function () {
			console.log('pie');
		}
	}
	
	var chart = require('../chart');
	chart.set('pie', Pie);
	return Pie;
});