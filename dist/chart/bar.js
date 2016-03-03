// 柱状图模块
define(function (require) {
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