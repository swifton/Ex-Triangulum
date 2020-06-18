function polygon() {
    this.vertices = [];
    this.edges = [];
}

function regular_polygon(n_sides) {
    var result = new polygon();
    
    for (var vertex_i = 0; vertex_i < n_sides; vertex_i += 1) {
        
    }
}

realtime = true;
var unit_pix = 50;
var field;
var all_edges = [];
var closed_edges = [];
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
	game_update();
	game_render();
}

function game_update() {}

function game_render() {
	var center_x = main_canvas.width / 2 + pan_offset_x + old_pan_offset_x;
	var center_y = main_canvas.height / 2 + pan_offset_y + old_pan_offset_y;
    
    main_context.save();
    main_context.scale(scale, scale);
	
	for (var polygon_i = 0; polygon_i < field.length; polygon_i += 1) {
		draw_polygon(field[polygon_i], [center_x, center_y]);
	}
	
	for (var edge_i = 0; edge_i < open_edges.length; edge_i += 1) {
		var edge = open_edges[edge_i];
		draw_line(center_x + unit_pix * edge[0], center_y + unit_pix * edge[1], center_x + unit_pix * edge[2], center_y + unit_pix * edge[3], "red");
	}
	
    main_context.restore();
}

// Center is the point on the canvas where the world point (0, 0) should be.
function draw_polygon(polygon, center) {
	main_context.globalAlpha = 1;
	main_context.lineWidth = 2;
	main_context.strokeStyle = "black";
	main_context.fillStyle = "green";
	main_context.beginPath();

	// Looping over edges, drawing each.
	for (var vx_i = 0; vx_i < polygon.length; vx_i += 1) {
		// World coordinates of the vertices incident to the edge.
		vx_1_w = polygon[vx_i];
		vx_2_w = polygon[(vx_i + 1) % polygon.length];

		// Canvas coordinates.
		vx_1_c_x = vx_1_w[0] * unit_pix + center[0];
		vx_1_c_y = vx_1_w[1] * unit_pix + center[1];
		vx_2_c_x = vx_2_w[0] * unit_pix + center[0];
		vx_2_c_y = vx_2_w[1] * unit_pix + center[1];
			
		if (vx_i == 0) context.moveTo(vx_1_c_x, vx_1_c_y);
		context.lineTo(vx_2_c_x, vx_2_c_y);
	}

	main_context.fill();
	main_context.stroke();
}

function create_foam() {
	field = [[[0, 0], [0, 1], [1, 1], [1, 0]]]
        open_edges = [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0]];
	vertices = [[0, 0, 18], [0, 1, 18], [1, 1, 18], [1, 0, 18]];
	
	for (var polygon_i = 0; polygon_i < 1000; polygon_i += 1) {
		// var bud_i = random_integer(0, field.length);
		var edge_i = random_integer(0, open_edges.length);
		add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
	}
	
	//add_polygon(get_edge(0, 0), 8);
	//add_polygon(get_edge(0, 1), 8);
	//add_polygon(get_edge(0, 2), 8);
	//add_polygon(get_edge(0, 3), 8);
}

function get_edge(bud_i, edge_i) {
	var bud = field[bud_i];
	var n = bud.length;
	return [bud[(edge_i) % n][0], bud[(edge_i) % n][1], bud[(edge_i + 1) % n][0], bud[(edge_i + 1) % n][1]]
}

function add_polygon(edge, type) {
	edges_to_close = [edge];
	var old_edge = [edge[0] - edge[2], edge[1] - edge[3]];
	var polygon = [[edge[2], edge[3]], [edge[0], edge[1]]];
	var angle = Math.PI * (1 - (type - 2) / type);
	var vx = [edge[0], edge[1]];
	var angle_15 = 12 * (type - 2) / type;
	
	if (!add_to_vertex(vx, angle_15)) return;
	
	for (var edgee_i = 0; edgee_i < type - 2; edgee_i += 1) {
		
		var new_edge = [0, 0];
		var orth = [old_edge[1], -old_edge[0]];
		
		new_edge[0] += Math.cos(angle) * old_edge[0];
		new_edge[1] += Math.cos(angle) * old_edge[1];
		
		new_edge[0] += Math.sin(angle) * orth[0];
		new_edge[1] += Math.sin(angle) * orth[1];
		
		var new_vx = [vx[0] + new_edge[0], vx[1] + new_edge[1]];
		
		polygon.push(new_vx);
		
		edges_to_close.push([vx[0], vx[1], new_vx[0], new_vx[1]]);
		
		for (var edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
			if (segments_intersect(open_edges[edg_i], [vx[0], vx[1], new_vx[0], new_vx[1]])) return;
		}
		
		vx = new_vx;
		old_edge = new_edge;
	}
	
	edges_to_close.push([vx[0], vx[1], edge[2], edge[3]])
	
        for (var vx_i = 0; vx_i < polygon.length; vx_i += 1) {
		var vx = polygon[vx_i];
		
		for (var v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, vertices[v_i])) {
				if (vertices[v_i][2] - angle_15 < 0) {
					return;
				}			
			}
		}
	}
	
	var found;
	
	for (var vx_i = 0; vx_i < polygon.length; vx_i += 1) {
		var vx = polygon[vx_i];
		found = false;
		
		for (var v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, vertices[v_i])) {
				vertices[v_i][2] -= angle_15;
				found = true
			}			
		}
		
		if (!found) vertices.push([vx[0], vx[1], 24 - angle_15]);
	}
	
	
	for (var e_i = 0; e_i < edges_to_close.length; e_i += 1) check_close_edge(edges_to_close[e_i]);
    
	field.push(polygon);
}

function check_close_edge(edge_to_check) {
	var to_push = true;
	for (var edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
		if (same_edge(edge_to_check, open_edges[edg_i])) {
			//closed_edges.push(edge_to_check);
			open_edges.remove(edg_i);
			to_push = false;
		}
	}
	if (to_push) open_edges.push(edge_to_check);
}

function add_to_vertex(vertex, angle_mul_15) {
	for (var vx_i = 0; vx_i < vertices.length; vx_i += 1) {
		if (same_vertex(vertex, vertices[vx_i])) {
			vertices[vx_i][2] -= angle_mul_15;
			if (vertices[vx_i][2] < 0) {
				vertices[vx_i][2] += angle_mul_15;
				return false;
			}
			else return true;
			
		}
	}
	
	vertices.push([vertex[0], vertex[1], 24 - angle_mul_15]);
	return true;
}

function same_vertex(vertex_1, vertex_2) {
	var threshold = 0.1;
	if (Math.abs(vertex_1[0] - vertex_2[0]) < threshold && Math.abs(vertex_1[1] - vertex_2[1]) < threshold) return true;
	return false;
}

function same_edge(edge_1, edge_2) {
	var threshold = 0.1;
	if (Math.abs(edge_1[0] - edge_2[0]) < threshold && Math.abs(edge_1[1] - edge_2[1]) < threshold && Math.abs(edge_1[2] - edge_2[2]) < threshold && Math.abs(edge_1[3] - edge_2[3]) < threshold) return true;
	if (Math.abs(edge_1[2] - edge_2[0]) < threshold && Math.abs(edge_1[1] - edge_2[3]) < threshold && Math.abs(edge_1[0] - edge_2[2]) < threshold && Math.abs(edge_1[3] - edge_2[1]) < threshold) return true;
	return false;
}

function segments_intersect(line1, line2) {
    x1 = line1[0]
        y1 = line1[1]
        x2 = line1[2]
        y2 = line1[3]
    
        x3 = line2[0]
        y3 = line2[1]
        x4 = line2[2]
        y4 = line2[3]
    
        side1 = (x3 - x1) * (y1 - y2) - (x1 - x2) * (y3 - y1)
        side2 = (x4 - x1) * (y1 - y2) - (x1 - x2) * (y4 - y1)
    
        side3 = (x1 - x3) * (y3 - y4) - (x3 - x4) * (y1 - y3)
        side4 = (x2 - x3) * (y3 - y4) - (x3 - x4) * (y2 - y3)
    
        return side1 * side2 < 0 && side3 * side4 < 0
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

function mouse_scroll(direction) {
    scale += direction * 0.1;
}

create_foam();
