function vector(x, y) {
	this.x = x;
	this.y = y;
}

function edge(v1, v2, polygon) {
	this.v1 = v1;
	this.v2 = v2;
	this.polygon1 = polygon;
	this.polygon2 = undefined;
}

function Polygon(vertices) {
	this.vertices = vertices;
	this.edges = [];

	for (var vx_i = 0; vx_i < vertices.length; vx_i += 1) {
		this.edges.push(new edge(vertices[vx_i], vertices[(vx_i + 1) % vertices.length], this));
	}
}

realtime = true;
var unit_pix = 50;
var canvas_center = [0, 0];
var polygons;
var open_edges = [];
var vertices = [];

var colors = ["red", "green", "blue", "yellow", "magenta", "cyan"];
var types = [3, 4, 6, 8];

var mouse_is_down;
var mouse_down_pos;
var pan_offset_x = 0;
var pan_offset_y = 0;
var old_pan_offset_x = 0;
var old_pan_offset_y = 0;
var scale = 1;

function step() {
	resize_canvas();
	clear_canvas();
	render();
}

function render() {
	// Hadndling canvas panning (operated by dragging the mouse).
	canvas_center[0] = main_canvas.width / 2 + pan_offset_x + old_pan_offset_x;
	canvas_center[1] = main_canvas.height / 2 + pan_offset_y + old_pan_offset_y;
    
	// Setting up canvas parameters that pertain to all drawing.
    main_context.save();
    main_context.scale(scale, scale);
	main_context.globalAlpha = 1;
	main_context.lineWidth = 2;
	
	// Preparing the canvas for drawing polygons
	main_context.strokeStyle = "black";
	main_context.fillStyle = "green";

	// Drawing polygons
	for (var polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
		polygon = polygons[polygon_i];

		main_context.beginPath();

		// Move to the last vertex of the polygon
		var last_vx = polygon.vertices[polygon.vertices.length - 1];
		var last_vx_canvas = world_to_canvas(last_vx);
		context.moveTo(last_vx_canvas[0], last_vx_canvas[1]);

		// Looping over vertices, drawing the edge to each vertex.
		for (var vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
			var vx_c = world_to_canvas(polygon.vertices[vx_i]);
			context.lineTo(vx_c[0], vx_c[1]);
		}

		main_context.fill();
		main_context.stroke();
	}
	
	// Preparing the canvas for drawing open edges
	main_context.strokeStyle = "red";

	// Drawing open edges
	main_context.beginPath();
	for (var edge_i = 0; edge_i < open_edges.length; edge_i += 1) {
		var edge = open_edges[edge_i];
		var vx_1c = world_to_canvas(edge.v1);
		var vx_2c = world_to_canvas(edge.v2);
				
		context.moveTo(vx_1c[0], vx_1c[1]);
		context.lineTo(vx_2c[0], vx_2c[1]);
	}
	main_context.stroke();
	
    main_context.restore();
}

function world_to_canvas(world_point) {
	var cx = world_point.x * unit_pix + canvas_center[0];
	var cy = world_point.y * unit_pix + canvas_center[1];
	return [cx, cy];
}

function create_foam() {
	var first_polygon = new Polygon([new vector(0, 0), new vector(0, 1), new vector(1, 1), new vector(1, 0)]);
	polygons = [first_polygon];
	
	open_edges = [];
	for (var edge_i = 0; edge_i < first_polygon.edges.length; edge_i += 1) {
		open_edges.push(first_polygon.edges[edge_i]);
	}

	vertices = [[0, 0, 18], [0, 1, 18], [1, 1, 18], [1, 0, 18]];
	
	for (var polygon_i = 0; polygon_i < 1000; polygon_i += 1) {
		var edge_i = random_integer(0, open_edges.length);
		add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
	}
}

function add_polygon(edge, type) {
	var old_edge = new vector(edge.v1.x - edge.v2.x, edge.v1.y - edge.v2.y);
	var polygon_vertices = [new vector(edge.v2.x, edge.v2.y), new vector(edge.v1.x, edge.v1.y)];
	var angle = Math.PI * (1 - (type - 2) / type);
	var vx = edge.v1;
	var angle_15 = 12 * (type - 2) / type;
	
	if (!add_to_vertex(vx, angle_15)) return;
	
	for (var edgee_i = 0; edgee_i < type - 2; edgee_i += 1) {
		
		var new_edge = new vector(0, 0);
		var orth = new vector(old_edge.y, -old_edge.x);
		
		new_edge.x += Math.cos(angle) * old_edge.x;
		new_edge.y += Math.cos(angle) * old_edge.y;
		
		new_edge.x += Math.sin(angle) * orth.x;
		new_edge.y += Math.sin(angle) * orth.y;
		
		var new_vx = new vector(vx.x + new_edge.x, vx.y + new_edge.y);
		
		polygon_vertices.push(new_vx);
		
		vx = new_vx;
		old_edge = new_edge;
	}

    for (var vx_i = 1; vx_i < polygon_vertices.length; vx_i += 1) {
		var vx = polygon_vertices[vx_i];
		
		for (var v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, new vector(vertices[v_i][0], vertices[v_i][1]))) {
				if (vertices[v_i][2] - angle_15 < -0.01) {
					return;
				}
			}
		}
	}
	
	var found;
	
	for (var vx_i = 1; vx_i < polygon_vertices.length; vx_i += 1) {
		var vx = polygon_vertices[vx_i];
		found = false;
		
		for (var v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, new vector(vertices[v_i][0], vertices[v_i][1]))) {
				vertices[v_i][2] -= angle_15;
				found = true
			}
		}
		
		if (!found) vertices.push([vx.x, vx.y, 24 - angle_15]);
	}
	
	var new_polygon = new Polygon(polygon_vertices);

	for (var edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
		for (var edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
			if (edges_intersect(open_edges[edg_i], new_polygon.edges[edge_i])) return;
		}
	}

	for (var edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
		check_close_edge(new_polygon.edges[edge_i]);
	}
	
	polygons.push(new_polygon);
	console.log("Success!")
}

function check_close_edge(edge_to_check) {
	var to_push = true;
	for (var edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
		if (same_edge(edge_to_check, open_edges[edg_i])) {
			open_edges.remove(edg_i);
			to_push = false;
		}
	}
	if (to_push) open_edges.push(edge_to_check);
}

function add_to_vertex(vertex, angle_mul_15) {
	for (var vx_i = 0; vx_i < vertices.length; vx_i += 1) {
		if (same_vertex(vertex, new vector(vertices[vx_i][0], vertices[vx_i][1]))) {
			vertices[vx_i][2] -= angle_mul_15;
			if (vertices[vx_i][2] < -0.01) {
				vertices[vx_i][2] += angle_mul_15;
				return false;
			}
			else return true;
			
		}
	}
	
	vertices.push([vertex.x, vertex.y, 24 - angle_mul_15]);
	return true;
}

function same_vertex(vertex_1, vertex_2) {
	var threshold = 0.1;
	if (manhattan(vertex_1, vertex_2) < threshold) return true;
	return false;
}

// The Manhattan distance between two points.
function manhattan(pt1, pt2) {
	return Math.abs(pt1.x - pt2.x) + Math.abs(pt1.y - pt2.y);
}

function same_edge(edge_1, edge_2) {
	var threshold = 0.1;
	
	if (manhattan(edge_1.v1, edge_2.v1) < threshold && manhattan(edge_1.v2, edge_2.v2) < threshold) return true;
	if (manhattan(edge_1.v1, edge_2.v2) < threshold && manhattan(edge_1.v2, edge_2.v1) < threshold) return true;
	return false;
}

function edges_intersect(edge_1, edge_2) {
    x1 = edge_1.v1.x;
    y1 = edge_1.v1.y;
    x2 = edge_1.v2.x;
    y2 = edge_1.v2.y;
    
    x3 = edge_2.v1.x;
    y3 = edge_2.v1.y;
    x4 = edge_2.v2.x;
    y4 = edge_2.v2.y;

    side1 = (x3 - x1) * (y1 - y2) - (x1 - x2) * (y3 - y1);
    side2 = (x4 - x1) * (y1 - y2) - (x1 - x2) * (y4 - y1);

    side3 = (x1 - x3) * (y3 - y4) - (x3 - x4) * (y1 - y3);
    side4 = (x2 - x3) * (y3 - y4) - (x3 - x4) * (y2 - y3);

    return side1 * side2 < 0 && side3 * side4 < 0;
}

function mouse_down(x, y) {
    mouse_is_down = true;
    mouse_down_pos = [x, y];
}

function mouse_up(x, y) {
    mouse_is_down = false;
    old_pan_offset_x += pan_offset_x;
    old_pan_offset_y += pan_offset_y;
    pan_offset_x = 0;
    pan_offset_y = 0;
}

function mouse_move(x, y) {
    if (mouse_is_down) {
        pan_offset_x = x - mouse_down_pos[0];
        pan_offset_y = y - mouse_down_pos[1];
    }
}

function space_down() {
	var edge_i = random_integer(0, open_edges.length);
	add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
}

function mouse_scroll(direction) {
    scale += direction * 0.1;
}

create_foam();
