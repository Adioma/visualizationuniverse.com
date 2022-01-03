// main init/rendering
$(function() {
	console.log( "ready!" );
	$("#modal").on("hidden.bs.modal", function () {
		closeModal();
	});

	$.getJSON("/data/data.min.json", function(data) {
		$('#modal').modal('show');

		for(var idx in data[groupId]) {
			var item = data[groupId][idx];
			if(item.slug == itemSlug) {
				dataItem = item;
				queries = item.data_queries;
				topics = item.data_topics;
				graphData = item.data_graph;
				break;
			}
		}
		if(graphData.length == 0) {
			//console.log("Data entry is not found!");
		}
		buildSparkline();
		buildRelatedItems(queries, "queriesId");
		buildRelatedItems(topics, "topicsId");
	});


});

function buildRelatedItems(items, parentId) {

	var parent = $("#" + parentId);
	for(var idx in items) {
		var item = items[idx];

		var htmlTemplate = "<div> " +
			"<div style=\"margin-bottom:5px;margin-top:8px;\">"+item.title+"</div>" +
			"<div class=\"progress\">" +
			"    <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow="+item.value+" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: "+item.value+"%;\">" +
			"        <span className=\"sr-only\">_value_</span>" +
			"    </div>" +
			"</div> " +
			"</div>";

		parent.append(htmlTemplate);
	}
}

function buildSparkline() {
	var width = 600;
	var height = 200;

	var svg = d3.selectAll("#sparklineId").append('svg')
		.attr('class', 'bigline')
		.attr("viewBox", "0 0 650 200")
		.style('overflow', 'visible');

	var x = d3.scaleLinear().range([30, width - 10]);

	var month = d3.timeFormat('%B %Y');
	var thismonth = d3.timeFormat('%B');
	var today = new Date();
	var dayString = month(today).toString()
	var newYear = + dayString.substring(dayString.indexOf(' ')) - 1;

	svg.append('text')
		.text(thismonth(today) + ' ' + newYear)
		.attr('x', 30)
		.attr('y', 195)
		.style('fill', 'white')
		.style('font-size', "10px");

	svg.append('text')
		.text(month(today))
		.attr('x', width-10)
		.attr('y', 195)
		.style('fill', 'white')
		.style('font-size', "10px");

	var y = d3.scaleLinear()
		.range([height - 20, 20]);

	var linedata = [];
	var emptyData = true;

	for (var j=0; j < graphData.length; j++){
		linedata.push({"index": j, "value": graphData[j].value});
		if (graphData[j].value > 0) {
			emptyData = false;
		}
	}

	x.domain(d3.extent(linedata, function(d) { return +d.index; }));
	y.domain([0, 100]);

	drawGradientForAverages(svg, linedata, x, y);

	var xAxis = d3.axisBottom(x).ticks(30);
	var yAxis = d3.axisLeft(y).tickSize(-570).tickValues([0,50,100]).ticks(4);

	svg.append('g').attr('class', 'axis')
		.attr('transform', 'translate(0, 180)')
		.call(xAxis)
		.selectAll('text')
		.remove();

	svg.append('g').attr('class', 'axis')
		.attr('transform', 'translate(30, 0)')
		.call(yAxis)
		.selectAll('text')
		.style('transform', 'translate(-20, 0)');

	svg.select("#yaxis").select("path").attr('stroke', '#fff');

	drawLastYearAverage(svg, linedata, x, y);
	drawThisYearAverage(svg, linedata, x, y);

	svg.append("line")
		.style("stroke", "#fff")
		.attr("x1", x(linedata[linedata.length-1].index)+1)
		.attr("y1", y(0)+6)
		.attr("x2", x(linedata[linedata.length-1].index)+1)
		.attr("y2", y(100));

	svg.append("line")
		.style("stroke", "#fff")
		.attr("x1", x(linedata[0].index))
		.attr("y1", y(0)+6)
		.attr("x2", x(linedata[0].index))
		.attr("y2", y(100));


	var linefunc = d3.line()
		.x(function(d) { return x(d.index); })
		.y(function(d) { return y(d.value); })
		.curve(d3.curveBasis);

	var sparks = svg.append('path')
		.datum(linedata)
		.attr('id', 'line1')
		.attr('fill', 'none')
		.attr('stroke', '#FDBD00')
		.attr('stroke-linejoin', 'round')
		.attr('stroke-linecap', 'round')
		.attr('stroke-width', 1.5)
		.attr('d', linefunc);

	svg.append('circle')
		.attr('fill', '#FDBD00')
		.attr('r', 3)
		.attr('cx', x(linedata[0].index))
		.attr('cy', y(linedata[0].value));

	if (emptyData) {
		svg.append('text')
			.style('fill', '#FFF')
			.style('font-size', "10px")
			.attr('x', 275)
			.attr('y', 50)
			.text("No data available");
	}
}

function drawGradientForAverages(svg,linedata, x, y) {
	if(dataItem.data_avg_curr != dataItem.data_avg_prev) {

		var gradient = svg.append("defs")
			.append("linearGradient")
			.attr("id", "gradient")
			.attr("x1", "0%")
			.attr("y1", "0%")
			.attr("x2", "0%")
			.attr("y2", "100%")
			.attr("spreadMethod", "pad");

		var avgCurr = dataItem.data_avg_curr;
		var avgPrev = dataItem.data_avg_prev;
		var color0pct = avgCurr > avgPrev ? "#60413c" : "#403b51";
		var color100pct = avgCurr > avgPrev ? "#403b51" : "#60413c";
		var rectHeight = Math.abs(y(avgCurr) - y(avgPrev)) - 2;
		var rectWidth = x(linedata[linedata.length-1].index) - x(linedata[0].index);
		var yPos = avgCurr > avgPrev ? y(avgCurr) : y(avgPrev);
		//var rectWidth =
		gradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", color0pct)
			.attr("stop-opacity", 1);

		gradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", color100pct)
			.attr("stop-opacity", 1);

		svg.append("rect")
			.attr('x', x(linedata[0].index))
			.attr('y', yPos + 1)
			.attr("width", rectWidth)
			.attr("height", rectHeight)
			.style("fill", "url(#gradient)")
			.append("title").text(dataItem.data_delta);
	}
}

function drawLastYearAverage(svg, linedata, x, y) {

	svg.append("line")
		.style("stroke", "#6d687e")
		.style("stroke-dasharray", ("11, 4"))
		.attr("x1", x(linedata[0].index)-14)
		.attr("y1", y(dataItem.data_avg_prev))
		.attr("x2", x(linedata[linedata.length-1].index)+9)
		.attr("y2", y(dataItem.data_avg_prev));

	svg.append("svg:image")
		.attr('x',x(linedata[0].index)-22)
		.attr('y',y(dataItem.data_avg_prev)-5.5)
		.attr('width', 8)
		.attr('height', 11)
		.attr("xlink:href","/assets/images/avg-arrow-right.png")

	svg.append('text')
		.attr('y', y(dataItem.data_avg_prev)-11)
		.style('fill', '#8c7323')
		.style('font-size', "8px")
		.append('svg:tspan')
		.attr('x', -9)
		.attr('dy', 3)
		.text(function(d) { return "Last"; })
		.append('svg:tspan')
		.attr('x', -10)
		.attr('dy', 10)
		.text(function(d) { return "year"; })
		.append('svg:tspan')
		.attr('x', -6)//-5 / average
		.attr('dy', 9)
		.text(function(d) { return "avg"; });
}
function drawThisYearAverage(svg, linedata, x, y) {

	if(dataItem.data_avg_curr != dataItem.data_avg_prev) {
		svg.append("line")
			.style("stroke", "#987152")
			.style("stroke-dasharray", ("11, 4"))
			.attr("x1", x(linedata[0].index)-14)
			.attr("y1", y(dataItem.data_avg_curr))
			.attr("x2", x(linedata[linedata.length-1].index)+9)
			.attr("y2", y(dataItem.data_avg_curr));
	}


	svg.append("svg:image")
		.attr('x',x(linedata[linedata.length-1].index)+9)
		.attr('y',y(dataItem.data_avg_curr)-5.5)
		.attr('width', 8)
		.attr('height', 11)
		.attr("xlink:href","/assets/images/avg-arrow-left.png")

	svg.append('text')
		.attr('y', y(dataItem.data_avg_curr)-7)
		.style('fill', '#8c7323')
		.style('font-size', "8px")
		.append('svg:tspan')
		.attr('x', x(linedata[linedata.length-1].index) + 21)
		//.attr('dy', 3)
		.text(function(d) { return "This"; })
		.append('svg:tspan')
		.attr('x', x(linedata[linedata.length-1].index) + 21)
		.attr('dy', 9)
		.text(function(d) { return "year"; })
		.append('svg:tspan')
		.attr('x', x(linedata[linedata.length-1].index) + 21)//-5 / average
		.attr('dy', 9)
		.text(function(d) { return "avg"; });

}