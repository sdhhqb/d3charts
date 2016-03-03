define(function (require) {
	var self = {};
	var _idBase = new Date() - 0;	// D3charts实例序号
    var _instances = {};    // D3charts实例map索引
    var DOM_ATTRIBUTE_KEY = '_d3charts_instance_';	// DOM中保存实例序号的属性名
    var dUtil = require('./util/dutil');

	self.version = '0.1.0';
	
	// 组件模块,legend,tip
	var componentLib = require('./component');
	componentLib.set('legend', require('./component/legend'));
	componentLib.set('axis', require('./component/axis'));
	
	// 图表模块
	var chartLib = require('./chart');
	chartLib.set('bar', require('./chart/bar'));

	self.init = function (dom) {
		var key = dom.getAttribute(DOM_ATTRIBUTE_KEY);

        if (!key) {
            key = _idBase++;
            dom.setAttribute(DOM_ATTRIBUTE_KEY, key);
        }
        if (_instances[key]) {
            // 同一个dom上多次init，自动释放已有实例
            _instances[key].dispose();
        }
        _instances[key] = new D3charts(dom);
        _instances[key].id = key;

        return _instances[key];
	};
	// test
	self.test = function () {
		console.log(componentLib.get('legend'));
		console.log(chartLib.get('line'));
		console.log(chartLib.get('bar'));
		console.log(chartLib.get('pie'));
	};


	function D3charts (dom) {
		this.dom = dom;
		this._svg = null;
		this._svgProp = null;
		// this._x = (d3.scale.linear().domain([0, 10]));
		// this._y = (d3.scale.linear().domain([0, 10]));
		this._option = {};
		this._chartList = [];	// 图表、组件实例，设置新option时，数组中的实例都要执行refresh
		this.chart = {};		// 图表索引
		this.component = {};	// 组件索引

		this._init();
	}
	D3charts.prototype = {
		_init: function () {
			this.dom.innerHTML = '';
		},
		/**
		 * 设置参数，绘制图表，类似echarts
		 * @param {[type]} option   [description]
		 * @param {[type]} notMerge [description]
		 */
		setOption: function (option, notMerge) {
			return this._setOption(option, notMerge);
		},
		_setOption: function (option, notMerge) {
			if (notMerge) {
				this._option = dUtil.clone(option);
			} else {
				this._option = dUtil.merge(this.getOption(), dUtil.clone(option));
			}
			this._render(this._option);
			return this;
		},
		_render: function (magicOption) {
			this._chartList = [];

			if (!this._svg) {
				this._svg = d3.select(this.dom).append("svg");
			}
			// 设置svg尺寸，计算绘图需要的属性
			this._svg.attr("height", magicOption.height)
					.attr("width", magicOption.width);
			this.calcSvgProp();

			this._renderComponent(magicOption);
			this._renderChart(magicOption);
		},
		/**
		 * 绘制组件
		 * @param  {[type]} magicOption [description]
		 * @return {[type]}             [description]
		 */
		_renderComponent: function (magicOption) {
			var componentList = [
                'title', 'legend', 'tooltip', 'dataRange', 'roamController',
                'grid', 'dataZoom', 'xAxis', 'yAxis', 'polar'
            ];
            var ComponentClass;
            var componentType;
            var component;

            for (var i = 0, l = componentList.length; i < l; i++) {
                componentType = componentList[i];
                component = this.component[componentType];
                if (magicOption[componentType]) {
                    if (component) {
                        component.refresh && component.refresh(magicOption, componentType);
                    } else {
                        ComponentClass = componentLib.get(
                            /^[xy]Axis$/.test(componentType) ? 'axis' : componentType
                        );
                        component = new ComponentClass(
                            magicOption, this._svg, this._svgProp, componentType
                        );
                        this.component[componentType] = component;
                    }
                    this._chartList.push(component);
                } else if (component) {
                    component.dispose();
                    this.component[componentType] = null;
                    delete this.component[componentType];
                }
            }
		},
		/**
		 * 绘制图表
		 * @param  {[type]} magicOption [description]
		 * @return {[type]}             [description]
		 */
		_renderChart: function (magicOption) {
			var ChartClass;
			var chartType;
			var chartMap = {};	//记录最新option的series中已经初始化的图表,每种类型的图表只用初始化一次
			var chart;
			// 遍历series数组，检查并初始化series中的各类图表
			for (var i = 0; i < magicOption.series.length; i++) {
				chartType = magicOption.series[i].type;
                if (!chartType) {
            		// series中该条数据没有指定图表类型
                    console.error('series[' + i + '] chart type has not been defined.');
                    continue;
                }
                // 初始化series中的图表
				if (!chartMap[chartType]) {
					chartMap[chartType] = true;
					ChartClass = chartLib.get(chartType);
					if (ChartClass) {
						if (this.chart[chartType]) {
							// 已有相同类型图表实例，使用新的数据刷新图表
							chart = this.chart[chartType];
							chart.refresh(magicOption);
						} else {
							// 没有同类图表，新建一个图表实例
							chart = new ChartClass(magicOption, this._svg, this._svgProp);
							this.chart[chartType] = chart;
							this._chartList.push(chart);
						}
					} else {
						// 当前指定类型的图表库文件没有载入
                        console.error(chartType + ' has not been required.');
					}
				}
				// 处理之前已有，但最新option中没有的图表类型实例
				for (chartType in this.chart) {
					if (!chartMap[chartType]) {
						this.chart[chartType].dispose();
						this.chart[chartType] = null;
						delete this.chart[chartType];
					}
				}
			}
		},
		/**
		 * 获取当前option的克隆
		 * @return {[type]} [description]
		 */
		getOption: function () {
			return dUtil.clone(this._option);
		},
		calcSvgProp: function () {
			var margins = this._option.margins;
			var height = this._option.height;
			var width = this._option.width;
			if (margins) {
				this._svgProp = {
					xStart: margins.left ? margins.left : 0,
					yStart: margins.bottom ? height - margins.bottom : height,
					xEnd: margins.right ? width - margins.right : width,
					yEnd: margins.top ? margins.top : 0,
					quadrantWidth: margins.left && margins.right ? width - margins.left - margins.right : width,
					quadrantHeight: margins.top && margins.bottom ? height - margins.top - margins.bottom : height
				}
			} else {
				this._svgProp = {				
					xStart: 0,
					yStart: height,
					xEnd: width,
					yEnd: 0,
					quadrantWidth: width,
					quadrantHeight: height
				}
			}
		},
		dispose: function () {

		}
	};

	return self;
});