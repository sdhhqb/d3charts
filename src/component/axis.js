// 坐标轴模块
define(function (require) {
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