// 线图模块
define(function (require) {
	function Line (option, svg, svgProp) {
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
	Line.prototype = {
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

	        this.renderLines();

	        this.renderDots();
	    },
	    setScale: function () {
	    	var DotCount = this.option.xAxis.data.length;
	    	var datamin, datamax, series;

	    	this._x = (d3.scale.linear().domain([0, DotCount-1])).range([0, this.svgProp.quadrantWidth]);
	    	series = this.option.series;
			datamin = [];
			datamax = [];
			for (var i = 0; i < series.length; i++) {
				datamin.push(d3.min(series[i].data));
				datamax.push(d3.max(series[i].data));
			}
			this._y = (d3.scale.linear()
						.domain([d3.min(datamin), d3.max(datamax)]))
						.range([this.svgProp.quadrantHeight, 0]);
	    },
	    renderLines: function () {
	    	var _this = this;
	        this._line = d3.svg.line()
        					.x(function (d) { return _this._x(d.x); })
                        	.y(function (d) { return _this._y(d.y); });
	                        
	        this._bodyG.selectAll("path.line")
	                    .data(this._data)
	                .enter()
	                .append("path")                
	                .style("stroke", function (d, i) { 
	                    return _this._colors(i);
	                })
	                .attr("class", "line");

	        this._bodyG.selectAll("path.line")
	                .data(this._data)
	                .transition()
	                .attr("d", function (d) { return _this._line(d); });
	    },
	    renderDots: function () {
	    	var _this = this;
	        this._data.forEach(function (list, i) {
	            _this._bodyG.selectAll("circle._" + i) //<-4E
	                        .data(list)
	                    .enter()
	                    .append("circle")
	                    .attr("class", "dot _" + i);

	            _this._bodyG.selectAll("circle._" + i)
	                    .data(list)                    
	                    .style("stroke", function (d) { 
	                        return _this._colors(i); //<-4F
	                    })
	                    .transition() //<-4G
	                    .attr("cx", function (d) { return _this._x(d.x); })
	                    .attr("cy", function (d) { return _this._y(d.y); })
	                    .attr("r", 4.5);
	        });
	    },
	    setData: function () {
	    	var _this = this;
	    	var series = _this.option.series;
	    	var dotCount = this.option.xAxis.data.length;
	    	_this._data = [];

			for (var i = 0; i < series.length; ++i) {
		    	this._data.push(d3.range(dotCount).map(function (j) {
		    			return {x: j, y: series[i].data[j]}
		    		})
		    	);
		    }
	    }
	};
	
	var chart = require('../chart');
	chart.set('line', Line);
	return Line;
});