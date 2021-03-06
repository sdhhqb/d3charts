define('d3charts/util/dutil',['require'],function (require) {
	var BUILTIN_OBJECT = {
        '[object Function]': 1,
        '[object RegExp]': 1,
        '[object Date]': 1,
        '[object Error]': 1
    };
    var objToString = Object.prototype.toString;
    function isDom(obj) {
        return obj && obj.nodeType === 1 && typeof obj.nodeName == 'string';
    }
    // 深度克隆对象
	function clone(source) {
        if (typeof source == 'object' && source !== null) {
            var result = source;
            if (source instanceof Array) {
                result = [];
                for (var i = 0, len = source.length; i < len; i++) {
                    result[i] = clone(source[i]);
                }
            } else if (!BUILTIN_OBJECT[objToString.call(source)] && !isDom(source)) {
                result = {};
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        result[key] = clone(source[key]);
                    }
                }
            }
            return result;
        }
        return source;
    }
    function mergeItem(target, source, key, overwrite) {
        if (source.hasOwnProperty(key)) {
            var targetProp = target[key];
            if (typeof targetProp == 'object' && !BUILTIN_OBJECT[objToString.call(targetProp)] && !isDom(targetProp)) {
                merge(target[key], source[key], overwrite);
            } else if (overwrite || !(key in target)) {
                target[key] = source[key];
            }
        }
    }
    // 对象合并
    function merge(target, source, overwrite) {
        for (var i in source) {
            mergeItem(target, source, i, overwrite);
        }
        return target;
    }
    return {
    	clone: clone,
    	merge: merge
    }
});
// 组件模块库
define('d3charts/component',['require'],function (require) {
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
// 图例模块
define('d3charts/component/legend',['require'],function (require) {
	var self = {
		x: 3,
		info: function () {
			console.log('legend');
		}
	}
	return self;
});
// 坐标轴模块
define('d3charts/component/axis',['require','../component'],function (require) {
	function Axis (option, svg, svgProp, axisType) {
		this.option = option;	//
		this._svg = svg;		//svg对象
		this.svgProp = svgProp;	//svg属性，尺寸、绘图区域等
		this.axisType = axisType;	//坐标轴类型
		this._x = null;		//坐标轴比例尺
		this._y = null;		//坐标轴比例尺
		this._xG = null;
		this._yG = null;
		
		this.refresh(option, axisType);
	}
	Axis.prototype = {
		refresh: function (newOption, axisType) {
			if (newOption) {
				this.option = newOption;
			}
			this.setScale(newOption, axisType);
			this.renderAxes(axisType);
		},
		// 设置坐标轴比例尺，分为数字型和分类型比例尺
		setScale: function (newOption, axisType) {
			var min, max;
			newOption[axisType] = this.reformOption(newOption, axisType);
			if (newOption[axisType].type == 'category') {
				this.categoryAxis(newOption[axisType], axisType);
			} else {
				this.valueAxis(newOption[axisType], axisType);
			}
		},
		// 数值型坐标轴比例尺
		valueAxis: function (axisOpt, axisType) {
			var min, max, datamin, datamax, series;
			if (axisType == 'xAxis') {
				min = d3.min(axisOpt.data);
				max = d3.max(axisOpt.data);
				this._x = d3.scale.linear()
							.domain([min, max])
							.range([0, this.svgProp.quadrantWidth]);
			} else {
				// 设置y轴比例尺,如果没有传入data，以series中的[最小值,最大值]作为为定义域
				if (axisOpt.data) {
					min = d3.min(axisOpt.data);
					max = d3.max(axisOpt.data);
					this._y = d3.scale.linear()
								.domain([min, max])
								.range([this.svgProp.quadrantHeight, 0]);
				} else {
					series = this.option.series;
					datamin = [];
					datamax = [];
					for (var i = 0; i < series.length; i++) {
						datamin.push(d3.min(series[i].data));
						datamax.push(d3.max(series[i].data));
					}
					this._y = d3.scale.linear()
								.domain([d3.min(datamin), d3.max(datamax)])
								.range([this.svgProp.quadrantHeight, 0]);
				}
			}
		},
		// 分类型坐标轴比例尺,必须在坐标轴参数中传入data
		categoryAxis: function (axisOpt, axisType) {
			if (axisType == 'xAxis') {
				if (axisOpt.boundaryGap) {
					this._x = d3.scale.ordinal()
	    						.domain([1,2,3,4,5,6,7,8])
	    						.rangePoints([0, this.svgProp.quadrantWidth],1);
				} else {
					this._x = d3.scale.ordinal()
								.domain(axisOpt.data)
								.rangePoints([0, this.svgProp.quadrantWidth]);
				}
			} else {
				this._y = d3.scale.ordinal()
							.domain(axisOpt.data)
							.rangePoints([this.svgProp.quadrantHeight, 0]);
			}
		},
		// 修正坐标轴参数格式
		reformOption: function (newOption, axisType) {
			if (!newOption[axisType].type) {
				// 横轴默认类型'category', 纵轴默认为'value'
				if (axisType == 'xAxis') {
					newOption[axisType].type = 'category';
				} else {
					newOption[axisType].type = 'value';
				}
			}
			if (typeof newOption[axisType].boundaryGap == 'undefined') {
				// 横轴默认有留白, 纵轴默认没有
				if (axisType == 'xAxis') {
					newOption[axisType].boundaryGap = true;
				} else {
					newOption[axisType].boundaryGap = false;
				}
			}
			return newOption[axisType];
		},
		// 绘制坐标轴
		renderAxes: function (axisType) {
	        var axesG;
            if (axisType == 'xAxis') {
            	if (!this._xG) {
            		this._xG = this._svg.append("g").attr("class", "xaxes");
            	}
        		axesG = this._xG;
            	this._svg.selectAll(".x.axis").remove();
            	this.renderXAxis(axesG);
            } else {
            	if (!this._yG) {
            		this._yG = this._svg.append("g").attr("class", "yaxes");
            	}
        		axesG = this._yG;
            	this._svg.selectAll(".y.axis").remove();
            	this.renderYAxis(axesG);
            }
	    },
	    // 绘制x轴
	    renderXAxis: function (axesG){
	    	var _this = this;

	        var xAxis = d3.svg.axis()
	                .scale(this._x)
	                .orient("bottom");

	        axesG.append("g")
	                .attr("class", "x axis")
	                .attr("transform", function () {
	                    return "translate(" + _this.svgProp.xStart + "," + _this.svgProp.yStart + ")";
	                })
	                .call(xAxis);

	        this._svg.selectAll("g.x g.tick")
	            .append("line")
	                .classed("grid-line", true)
	                .attr("x1", 0)
	                .attr("y1", 0)
	                .attr("x2", 0)
	                .attr("y2", - this.svgProp.quadrantHeight);
	    },
	    // 绘制y轴
	    renderYAxis: function (axesG){
	    	var _this = this;
	        var yAxis = d3.svg.axis()
	                .scale(this._y)
	                .orient("left");

	        axesG.append("g")
	                .attr("class", "y axis")
	                .attr("transform", function () {
	                    return "translate(" + _this.svgProp.xStart + "," + _this.svgProp.yEnd + ")";
	                })
	                .call(yAxis);
	                
	        this._svg.selectAll("g.y g.tick")
	            .append("line")
	                .classed("grid-line", true)
	                .attr("x1", 0)
	                .attr("y1", 0)
	                .attr("x2", this.svgProp.quadrantWidth)
	                .attr("y2", 0);
	    }
	};

	var component = require('../component');
	component.set('axis', Axis);
	return Axis;
});
// 图表模块库
define('d3charts/chart',['require'],function (require) {
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
// 柱状图模块
define('d3charts/chart/bar',['require','../chart'],function (require) {
	function Bar (option, svg, svgProp) {
		this.option = option;
		this._svg = svg;
		this.svgProp = svgProp;

		this._bodyG = null;
		this._line = null;
		this._data = [];	//传入的series处理后的数据
		this._x = null;		//在x轴方向上的比例尺
		this._y = null;		//在y轴方向上的比例尺
		this._colors = d3.scale.category10();

		this.refresh(option);
	}
	Bar.prototype = {
		refresh: function (newOption) {
			if (newOption) {
				this.option = newOption;
			}
        	this.setData();
        	this.setScale();
	        this.render();
	    },
	    render: function () { // <-2D
	        if (!this._bodyG) {
	            this._bodyG = this._svg.append("g")
	                    .attr("class", "body")
	                    .attr("transform", "translate(" 
	                        + this.svgProp.xStart + "," 
	                        + this.svgProp.yEnd + ")") // <-2E
	                    .attr("clip-path", "url(#body-clip)");        
	        }
	        this.renderBars();
	    },
	    // 设置图形标尺，优先参考坐标轴的标尺
	    setScale: function () {
	    	var datamin, datamax, xaxis, yaxis, series;

    		xaxis = this.option.xAxis;
	    	this._x = d3.scale.ordinal()
	    				.domain(xaxis.data)
	    				.rangePoints([0, this.svgProp.quadrantWidth], xaxis.boundaryGap ? 1 : 0);

	    	yaxis = this.option.yAxis;
			if (yaxis && yaxis.data) {
				this._y = d3.scale.linear()
							.domain([d3.min(yaxis.data), d3.max(yaxis.data)])
							.range([this.svgProp.quadrantHeight, 0]);
			} else {
				datamin = [];
				datamax = [];
				series = this.option.series;
				for (var i = 0; i < series.length; i++) {
					datamin.push(d3.min(series[i].data));
					datamax.push(d3.max(series[i].data));
				}
				this._y = d3.scale.linear()
							.domain([d3.min(datamin), d3.max(datamax)])
							.range([this.svgProp.quadrantHeight, 0]);
			}
	    },
	    renderBars: function () {
	    	var padding = 5;
	    	var _this = this;
	    	this._data = this._data[0];		// 暂时只处理一组数据
	                        
	        this._bodyG.selectAll("rect.bar")
	                    .data(this._data)
	                .enter()
	                .append("rect")
	                .attr("class", "bar");

            // var barW = Math.floor(_this.svgProp.quadrantWidth /_this. _data.length) - padding;
            var barW = 30;
	        this._bodyG.selectAll("rect.bar")
	                .data(this._data)
	                .transition()
	                .attr("x", function (d) {return _this._x(d.x) - barW/2; })
	                .attr("y", function (d) { 
	                	var y = _this._y(d.y);
	                	if (y ==  _this.svgProp.yStart - _this.svgProp.yEnd) {
	                		y = y - 2;
	                	}
	                	return y;
	                })
	                .attr("height", function (d) { 
	                	var h = _this.svgProp.yStart - _this._y(d.y) - _this.svgProp.yEnd; 
	                	if (h == 0) {
	                		h = 2;
	                	} 
	                	return h;
	                })
	                .attr("width", function(d){
	                    return barW;
	                });
	    },
	    setData: function () {
	    	var _this = this;
	    	var series = _this.option.series;
	    	var dotCount = this.option.xAxis.data.length;
	    	_this._data = [];

	    	function randomData() {
			    return Math.random() * 8;
			}

			for (var i = 0; i < series.length; ++i) {
		    	this._data.push(d3.range(dotCount).map(function (j) {
		    			return {x: _this.option.xAxis.data[j], y: series[i].data[j]}
		    		})
		    	);
		    }
	    }
	};
	
	var chart = require('../chart');
	chart.set('bar', Bar);
	return Bar;
});
define('d3charts/d3charts',['require','./util/dutil','./component','./component/legend','./component/axis','./chart','./chart/bar'],function (require) {
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
define('d3charts', ['d3charts/d3charts'], function (main) { return main; });

// 饼状模块
define('d3charts/chart/pie',['require','../chart'],function (require) {
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
