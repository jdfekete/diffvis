(function (glob) {
    function DiffVis(other) {
	this.matchList = other ? other.matchList : null;
	this.width = other ? other.width : 100;
	this.height = other ? other.height : 0;
	this.vertical = other ? other.vertical : true;
	this.totalHeight = other ? other.totalHeight : 100;
	this.offset = other ? other.offset : 5;
	this.lineList = other ? other.lineList : null;
	this.selector = other ? other.selector : "#diffs";
	this.className = other ? other.className : "diffvis";
	this.text1 = other ? other.text1 : null;
	this.text2 = other ? other.text2 : null;
	this.framed = other ? other.framed : false;
	this.scroll1 = other ? other.scroll1 : null;
	this.scroll2 = other ? other.scroll2 : null;
    };

    DiffVis.prototype.version = "0.0.1";

    DiffVis.prototype.setMatchList = function(ml) {
	this.matchList = ml;
	return this;
    };

    DiffVis.prototype.setWidth = function(w) {
	this.width = w;
	return this;
    };

    DiffVis.prototype.setHeight = function(h) {
	this.height = h;
	return this;
    };

    DiffVis.prototype.setTotalHeight = function(h) {
	this.totalHeight = h;
	return this;
    };

    DiffVis.prototype.setFramed = function(f) {
	if (f == null) f = true;
	this.framed = f;
	return this;
    };

    DiffVis.prototype.setHorizontal = function(t) {
	if (t == null) t = true;
	this.vertical = !t;
	return this;
    };

    DiffVis.prototype.setVertical = function(t) {
	if (t == null) t = true;
	this.vertical = t;
	return this;
    };

    DiffVis.prototype.setSelector = function(s) {
	this.selector = s;
	return this;
    };

    DiffVis.prototype.setClassName = function(c) {
	this.className = c;
	return this;
    };

    DiffVis.prototype.setTransform = function(t) {
	this.transform = t;
	return this;
    };

    DiffVis.prototype.setup = function(text1, text2) {
	if (text1 == null)
	    ; // don't touch text1
	else if (typeof text1 === "string")
	    this.text1 = d3.select(text1)[0][0];
	else
	    this.text1 = text1;

	if (text2 == null)
	    ; 
	else if (typeof text2 === "string")
	    this.text2 = d3.select(text2)[0][0];
	else
	    this.text2 = text2;

	this.totalHeight = Math.max(
	    this.text1.scrollHeight,
	    this.text2.scrollHeight);
	if (! this.matchList) {
	    this.computeMatchList(this.text1, this.text2);
	    this.lineList = [];
	}
	if (! this.lineList)
	    this.computeLineList();

	return this;
    };

    DiffVis.prototype.setScrolls = function(s1, s2) {
	this.scroll1 = d3.select(s1)[0][0];
	this.scroll2 = d3.select(s2)[0][0];
	return this;
    };

    DiffVis.prototype.computeLineList = function() {
	var y1 = this.getTotalTop(this.text1),
	    y2 = this.getTotalTop(this.text2);
	
	this.lineList = [];
	for (var match in this.matchList) {
	    var id1 = this.matchList[match][0], 
	        id2 = this.matchList[match][1], 
	        e1 = document.getElementById(id1),
	        e2 = document.getElementById(id2),
	        span1, span2;
	    if (e1 && e2) {
		span1 = this.getSpan(e1, y1);
		span2 = this.getSpan(e2, y2);
		this.lineList.push({
		    id1 : id1,
		    top1 : span1[0],
		    bottom1 : span1[1],
		    id2 : id2,
		    top2 : span2[0],
		    bottom2 : span2[1],
		});
	    }
	}
	return this;
    };

    DiffVis.prototype.computeMatchList = function(text1, text2) {
	var id1List = this.getIdList(text1);
	var id2List = this.getIdList(text2);
	this.matchList = [];
	n = Math.min(id1List.length, id2List.length);
	for ( var i = 0; i < n; i++) {
	    this.matchList.append([ id1List[i], id2List[i] ]);
	}
	return this;
    };

    DiffVis.prototype.getIdList = function(text) {
	var ids = d3.select(text).selectAll("[id]");
	return ids[0].map(function(n) {
	    return n.id;
	});
    };

    DiffVis.prototype.getTotalTop = function(e) {
	if (!e)
	    return 0;
	return this.getTotalTop(e.offsetParent) + e.offsetTop;
    };

    DiffVis.prototype.getSpan = function(e, y0) {
	var start = this.getTotalTop(e) - y0;
	end = start + e.offsetHeight;
	return [ start, end ];
    };

    DiffVis.prototype.createDOMElement = function() {
	if (this.height == 0)
	    this.height = this.totalHeight;
	var w = this.vertical ? this.width : this.height;
	var h = this.vertical ? this.height : this.width;
	var iw = (this.vertical ? this.width : this.totalHeight);
	var ih = (this.vertical ? this.totalHeight : this.width);

	this.svg = d3.select(this.selector)
	    .append("svg:svg")
	    .attr("class", this.className)
	    .attr("width", w)
	    .attr("height", h)
	    .attr("preserveAspectRatio", "none")
	    .attr("viewBox", "0 0 " + iw  + " " + ih);
	if (this.framed) {
	    this.svg.append("svg:rect")
	    .attr("class", "frame")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", iw)
	    .attr("height", ih);
	}
	
	var it = this;
	this.lines = this.svg
	    .append("svg:g")
	    .attr("transform", this.vertical ? "rotate(0)" : "rotate(-90) translate("+ (-this.width)+" 0)")
	    .selectAll(".diffGroup")
	    .data(this.lineList, function(d) { return d; });
	var it = this;
	this.lines.enter()
	    .append("svg:g")
	    .on("click", function(d) { it.click(d, d3.svg.mouse(this)); })
	    .attr("class", "diffGroup");
	this.lines.append("svg:line")
	    .attr("class", "leftMark")
	    .attr("x1", this.offset)
	    .attr("x2", this.offset)
	    .attr("y1", function(d) { return d.top1; })
	    .attr("y2", function(d) { return d.bottom1; });
		
	this.lines.append("svg:line")
	    .attr("class", "linkMark")
	    .attr("x1", this.offset)
	    .attr("x2", this.width - this.offset)
	    .attr("y1", function(d) { return (d.top1 + d.bottom1) / 2; })
	    .attr("y2", function(d) { return (d.top2 + d.bottom2) / 2; })
	    .append("svg:title")
	    .text(function(d) { return it.getToolTip(d); });

	this.lines.append("svg:line")
	    .attr("class", "rightMark")
	    .attr("x1", this.width - this.offset)
	    .attr("x2", this.width - this.offset)
	    .attr("y1", function(d) { return d.top2; })
	    .attr("y2", function(d) { return d.bottom2; });
	return this;
    };

    DiffVis.prototype.getToolTip = function(d) {
	return d.id1 + " ->" + d.id2;
    };

    DiffVis.prototype.isVisible = function(scroll, top, bottom) {
	return bottom > scroll.scrollTop
	    && top < (scroll.scrollTop + scroll.offsetHeight);
    };

    DiffVis.prototype.setVisible = function(scroll, top, bottom) {
	var up = top - scroll.scrollTop; 
	var down = bottom - (scroll.scrollTop + scroll.offsetHeight);
	if (Math.abs(up) < Math.abs(down)) {
	    scroll.scrollTop = top;
	} else {
	    scroll.scrollTop = bottom - scroll.offsetHeight;
	}
	return this;
    };
	
    DiffVis.prototype.click = function(d, mp) {
	if (!this.scroll1 || !this.scroll2)
	    return;
	this.leftOrigin = this.scroll1.scrollTop;
	this.rightOrigin = this.scroll2.scrollTop;
	if (mp) {
	    var y = mp[1];
	    this.scroll1.scrollTop = d.top1 - y;
	    this.scroll2.scrollTop = d.top2 - y;
	    return;
	}
	var v1 = this.isVisible(this.scroll1, d.top1, d.bottom1);
	var v2 = this.isVisible(this.scroll2, d.top2, d.bottom2);
	if (! v1) {
	    if (v2) {
		this.scroll1.scrollTop = d.top1 - (d.top2 - this.scroll2.scrollTop);
	    }
	    else {
		this.setVisible(this.scroll1, d.top1, d.bottom1);
	    }
	}
	if (! v2) {
	    this.setVisible(this.scroll2, d.top2, d.bottom2);
	}
    };

    DiffVis.prototype.scroll = function() {
	//this.computeLineList();
	var leftOrigin = 0, rightOrigin = 0;
	if (this.scroll1)
	    leftOrigin = this.scroll1.scrollTop;
	if (this.scroll2)
	    rightOrigin = this.scroll2.scrollTop;
	this.lines.select(".leftMark")
	    .attr("x1", this.offset)
	    .attr("x2", this.offset)
	    .attr("y1", function(d) { return d.top1 - leftOrigin; })
	    .attr("y2", function(d) { return d.bottom1 - leftOrigin; });
	this.lines.select(".linkMark")
	    .attr("x1", this.offset)
	    .attr("x2", this.width - this.offset)
	    .attr("y1", function(d) { return (d.top1 + d.bottom1) / 2 - leftOrigin; })
	    .attr("y2", function(d) { return (d.top2 + d.bottom2) / 2 - rightOrigin; });
	this.lines.select(".rightMark")
	    .attr("x1", this.width - this.offset)
	    .attr("x2", this.width - this.offset)
	    .attr("y1", function(d) { return d.top2 - rightOrigin; })
	    .attr("y2", function(d) { return d.bottom2 - rightOrigin; });
    };

    DiffVis.prototype.showScroll = function() {
	var leftOrigin = 0, leftHeight = this.height;
	var rightOrigin = 0, rightHeight = this.height;
	if (this.scroll1) {
	    leftOrigin = this.scroll1.scrollTop;
	    leftHeight = this.scroll1.clientHeight;
	}
	if (this.scroll2) {
	    rightOrigin = this.scroll2.scrollTop;
	    rightHeight = this.scroll2.clientHeight;
	}
	if (this.leftViewport == null) {
	    this.leftViewport = this.lines.append("svg:rect")
		.attr("class", "left")
		.attr("x", 0)
		.attr("y", leftOrigin)
		.attr("width", 2*this.offset)
		.attr("height", leftHeight);
	}
	else {
	    this.leftViewport
		.transition()
		.duration(200)
		.attr("y", leftOrigin)
		.attr("height", leftHeight);
	}
	if (this.rightViewport == null) {
	    this.rightViewport = this.lines.append("svg:rect")
		.attr("class", "right")
		.attr("x", this.width-2*this.offset)
		.attr("y", rightOrigin)
		.attr("width", 2*this.offset)
		.attr("height", rightHeight);
	}
	else {
	    this.rightViewport
		.transition()
		.duration(200)
		.attr("y", rightOrigin)
		.attr("height", rightHeight);
	}
    };
    
    glob.DiffVis = DiffVis;
})(this);
