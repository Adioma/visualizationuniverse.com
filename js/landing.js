var gActiveGroups = [];
gActiveGroups.push("charts");
gActiveGroups.push("books");
gActiveGroups.push("tools");

function generateActiveMoonIdx() {
	var groupIdx = Math.floor(Math.random() * 3);
	if(groupIdx > 2) {		
		return;
	}
	var  tempGroup = gActiveGroups[groupIdx];
	if(gNodes[tempGroup]) { // during initialization, the data may not be ready yet
		//console.log("Changed groupid to " + tempGroup);
		window.gActiveGroupId = gActiveGroups[groupIdx];	
	}
	
	var activeIdx = Math.floor(Math.random() * gNodes[gActiveGroupId].children.length);
	var currNodes = gNodes[gActiveGroupId].children;
	var activeId = 0;
	for(var idx in currNodes){
		var currNode = currNodes[idx];
		if(idx == activeIdx) {
			activeId = currNode.id;
			break;
		}
	}
	if(activeId == 0) {
		alert("Failed to find a node by index");
	} else {
		window.gActiveId = activeId;
	}
}
function pickActiveMoon() {
	
	if(window.gOrbitRuns === false) {
		return;
	}
	
	
	if(window.gActiveId) {
		var elem = d3.select("g.node > #circle" + window.gActiveId);
		elem.style("fill", "#827C87");
		elem.style("opacity",  "0.67");
		
		d3.select("#gnode-" + window.gActiveId).select("text").remove();
	}
	
	generateActiveMoonIdx();
	elem = d3.select("g.node > #circle" + gActiveId);
	elem.style("fill", "#C7A77C");				
	elem.style("opacity",  "");
	
	var node = getNodeById(gActiveId);
	if(node) {
		
		var parent = d3.select("#gnode-" + window.gActiveId);
		
		var linkElem = parent.append("svg:a").attr("xlink:href", "javascript:void(0)");
		
		var label = cutLabel(node.name);
		
		var textElem = linkElem.append("text").text(label)
				.classed("moon-label", true)
				.attr("x", 20)
				.attr('opacity', 0)
				.transition()
				.duration(500)
				.attr('opacity', 1);
		
		var width = node.name.length*4;
		var height = 20;
		
		var rectElem = linkElem.append("svg:rect");
			rectElem.attr("y", -height)					  
				.attr("x", 10)
		  		.style("fill", "none")
		  		.attr("height", height + 5)
		  		.attr("width", width + 10);					
	}	
}

function cutLabel(label) {
	var res = label;
	if(label.indexOf(":") != -1) {
		res = label.substring(0, label.indexOf(":"));
	}
	return res;
}

var gNextId = 1;
var prevOrbitSpace = 0;
var prevOrbitSpaceDiff = 0;
function prepareNodes(name, id, groupId, groupUrl, orbitBase, rootRadius, moonRadius, gradient) {
	res = {};
	res.name= name;
	res.root = true;
	res.id = id;
	res.link = groupUrl;
	res.rootRadius = rootRadius;
	res.moonRadius = moonRadius;
	res.gradient = gradient;
	res.children = [];
	//var orbitBase = 190;//198;
	orbitFactors = {};
	orbitFactors["charts"] = 12;
	orbitFactors["books"] = 9;
	orbitFactors["tools"] = 6;
	var activeIdx = Math.floor(Math.random() * gData.charts.length) + 1;
	
	
	var buildNode = function(item) {
		var node = {};
		node.id = gNextId++;
		node.name = item.title;
		node.link = groupUrl + item.slug;
		var orbitSpace = Math.floor(Math.random() * 3);
		while(orbitSpace == prevOrbitSpace){ 
			orbitSpace = Math.floor(Math.random() * 3);
		}
		prevOrbitSpaceDiff = Math.abs(prevOrbitSpaceDiff - orbitSpace);
		prevOrbitSpace = orbitSpace;
		
		node.orbitLength = orbitSpace * orbitFactors[groupId] + orbitBase;

		if(idx == activeIdx) {
			node.active = true;
		}
		return node;
	};
	if(groupId == "tools") {
		for(var i = 0; i < 2; i++) {
			for(var idx in gData["tools_generic"]) {
				var item = gData["tools_generic"][idx];
				var node = buildNode(item);
				res.children.push(node);
			}
			for(var idx in gData["tools_pro"]) {
				var item = gData["tools_pro"][idx];
				var node = buildNode(item);
				res.children.push(node);
			}
		}
	} else {
		for(var i = 0; i < 2; i++) {
			for(var idx in gData[groupId]) {
				var item = gData[groupId][idx];
				var node = buildNode(item);
				res.children.push(node);
			}				
		}
		
	}
	
	return res;
}

function getNodeById(id) {
	var groupId = window.gActiveGroupId;
	for(var idx in window.gNodes[groupId].children) {				
		var node = window.gNodes[groupId].children[idx];
		if(node.id == id) {
			return node;
		}
	}
	return false;
}
function drawOrbit(_data, containerId, groupId) { // #planet-charts

	window.gOrbitRuns = true;
				
	var orbit = d3.layout.orbit().size([ 1000, 1000 ])
			.children(function(d) {
				return d.children
				})
			.revolution(function(d) {
					return -1.5;
				})
			.speed(0.1)
			.nodes(_data);
	
	
	d3.select(containerId)
		.selectAll("g.node")
		.data(orbit.nodes())
		.enter()
		.append("g")				
		.attr("class", "node")
		.attr("transform", function(d) {
						return "translate(" + d.x + "," + d.y + ")"
			})
		.attr("id", function(d) {
				return "gnode-" + d.id;
			})			
		.on("mouseover", nodeOver)
		.on("mouseout", nodeOut)
		.on("click", function(e) {				
				//window.gOrbits[groupId].stop();
				clearInterval(window.gActiveMoonTimer);
				var potential = "/" + groupId + "/";
				if(potential == e.link) {
					window.location = e.link;
				} else {
					window.location = potential + "?redirect=" + e.link;	
				}
	});

	d3.select(containerId).selectAll("g.node")
	.append("circle")
	.attr("style", "cursor:pointer")
	.attr("r", function(d) {
				return d.root ? _data.rootRadius : _data.moonRadius;
		})
	.attr("id", function(d) {
				return "circle" + d.id;
		})			
	.style("fill", function(d) {
				return d.root ? "": "#827C87";
		})
	.style("opacity", function(d) {
				return !d.root ? "0.67" : "0.00001";
			});
	
	orbit.on("tick", function() {
		d3.selectAll("g.node").attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")"
		});				
	
		d3.selectAll("circle.ring").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});
	});

	orbit.start();
	
	
	window.gOrbites[groupId] = orbit;
	
	function nodeOver(d) {
		orbit.stop();
		window.gOrbitRuns = false;
		var node = getNodeById(gActiveId);
		
		if(node.id == d.id || d.root === true) {
			return;
		}
		var elem = d3.select(this).select("circle");
		elem.style("fill", "#C7A77C");				
		elem.style("opacity",  "");
		
		d3.select(this).append("text").text(cutLabel(d.name))
			.classed("moon-label", true)
			.attr("x", 20)
			.attr('opacity', 0)
			.transition()
			.duration(750)
			.attr('opacity', 1);
	}

	function nodeOut(d) {
		orbit.start();
		window.gOrbitRuns = true;
		var node = getNodeById(gActiveId);
		if(node.id == d.id || d.root === true) {
			return;
		}
		
		var elem = d3.select(this).select("circle");
		elem.style("fill", "#827C87");				
		elem.style("opacity",  "0.67");
		
		d3.select(this).select("text").remove();
	}
}

function navigateToGrid(node) {	
	window.location = node.link;
}