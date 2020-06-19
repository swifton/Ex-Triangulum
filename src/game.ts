function random_integer(min: number, max: number): number { // Including min, excluding max
	return (min + Math.floor(Math.random() * (max - min)));
}

interface Vector {
	x: number;
	y: number;
}

function mul(vec: Vector, scalar: number): Vector {
	return {x: vec.x * scalar, y: vec.y * scalar};
}

function sum(vec_1: Vector, vec_2: Vector): Vector {
	return {x: vec_1.x + vec_2.x, y: vec_1.y + vec_2.y};
}

interface Edge {
	v1: Vector;
	v2: Vector;
	polygon1: Polygon;
	polygon2: Polygon;
}

class Polygon {
	edges: Edge[];

	constructor(public vertices: Vector[]) {
		this.edges = [];
		for (let vx_i = 0; vx_i < vertices.length; vx_i += 1) {
			this.edges.push({v1: vertices[vx_i], v2: vertices[(vx_i + 1) % vertices.length], polygon1: this, polygon2: undefined});
		}
	}
}

interface Vertex {
	v: Vector;
	angle: number; // The multiple of 15 degrees
}

let unit_pix: number = 50;
let canvas_center = [0, 0];
let polygons: Polygon[];
let open_edges: Edge[] = [];
let vertices: Vertex[] = [];

let colors: String[] = ["red", "green", "blue", "yellow", "magenta", "cyan"];
let types: number[] = [3, 4, 6, 8];

let mouse_down_pos: number[];
let pan_offset_x: number = 0;
let pan_offset_y: number = 0;
let old_pan_offset_x: number = 0;
let old_pan_offset_y: number = 0;
let scale: number = 1;

let last_edge: Edge;

let mouse_world_coord: Vector = {x: 0, y: 0};
let hovered_polygon: Polygon = undefined;

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
	for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
		let polygon = polygons[polygon_i];

		main_context.beginPath();

		// Move to the last vertex of the polygon
		let last_vx = polygon.vertices[polygon.vertices.length - 1];
		let last_vx_canvas = world_to_canvas(last_vx);
		main_context.moveTo(last_vx_canvas.x, last_vx_canvas.y);

		// Looping over vertices, drawing the edge to each vertex.
		for (let vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
			let vx_c = world_to_canvas(polygon.vertices[vx_i]);
			main_context.lineTo(vx_c.x, vx_c.y);
		}

		main_context.fill();
		main_context.stroke();
	}
	
	// Preparing the canvas for drawing open edges
	main_context.strokeStyle = "red";

	// Drawing open edges
	main_context.beginPath();
	for (let edge_i = 0; edge_i < open_edges.length; edge_i += 1) {
		let edge = open_edges[edge_i];
		let vx_1c = world_to_canvas(edge.v1);
		let vx_2c = world_to_canvas(edge.v2);
				
		main_context.moveTo(vx_1c.x, vx_1c.y);
		main_context.lineTo(vx_2c.x, vx_2c.y);
	}
	main_context.stroke();
	
	// Drawing the last edge for debugging purposes
	main_context.strokeStyle = "blue";

	main_context.beginPath();
	let vx_1c = world_to_canvas(last_edge.v1);
	let vx_2c = world_to_canvas(last_edge.v2);
				
	main_context.moveTo(vx_1c.x, vx_1c.y);
	main_context.lineTo(vx_2c.x, vx_2c.y);
	main_context.stroke();

	// Visualizing the mouse position.
	main_context.fillStyle = "red";
	main_context.beginPath();
	let mouse_canvas_coord = world_to_canvas(mouse_world_coord);
	main_context.arc(mouse_canvas_coord.x, mouse_canvas_coord.y, 5, 0, 2 * Math.PI);
	main_context.fill();

	if (hovered_polygon != undefined) {
		main_context.beginPath();

		// Move to the last vertex of the polygon
		let last_vx = hovered_polygon.vertices[hovered_polygon.vertices.length - 1];
		let last_vx_canvas = world_to_canvas(last_vx);
		main_context.moveTo(last_vx_canvas.x, last_vx_canvas.y);

		// Looping over vertices, drawing the edge to each vertex.
		for (let vx_i = 0; vx_i < hovered_polygon.vertices.length; vx_i += 1) {
			let vx_c = world_to_canvas(hovered_polygon.vertices[vx_i]);
			main_context.lineTo(vx_c.x, vx_c.y);
		}

		main_context.fill();
	}
	
    main_context.restore();


}

function canvas_to_world(canvas_point: Vector): Vector {
	let wx: number = (canvas_point.x - canvas_center[0]) / unit_pix;
	let wy: number = (canvas_point.y - canvas_center[1]) / unit_pix;
	return {x: wx, y: wy};
}

function world_to_canvas(world_point: Vector): Vector {
	let cx: number = world_point.x * unit_pix + canvas_center[0];
	let cy: number = world_point.y * unit_pix + canvas_center[1];
	return {x: cx, y: cy};
}

function create_foam() {
	let first_polygon = new Polygon([{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}]);
	polygons = [first_polygon];
	
	open_edges = [];
	let edge_i;
	for (edge_i = 0; edge_i < first_polygon.edges.length; edge_i += 1) {
		open_edges.push(first_polygon.edges[edge_i]);
	}

	last_edge = first_polygon.edges[0];

	vertices = [{v: {x: 0, y: 0}, angle: 18}, {v: {x: 0, y: 1}, angle: 18}, {v: {x: 1, y: 1}, angle: 18}, {v: {x: 1, y: 0}, angle: 18}];
	
	for (let polygon_i = 0; polygon_i < 1000; polygon_i += 1) {
		edge_i = random_integer(0, open_edges.length);
		// last_edge = new edge(open_edges[edge_i].v1, open_edges[edge_i].v2, undefined);
		add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
	}
}

function add_polygon(edge: Edge, type: number): void {
	let old_edge = {x: edge.v1.x - edge.v2.x, y: edge.v1.y - edge.v2.y};
	let polygon_vertices = [edge.v2, edge.v1];
	let angle = Math.PI * (1 - (type - 2) / type);
	let vx = edge.v1;
	let angle_15 = 12 * (type - 2) / type;
	
	if (!add_to_vertex(vx, angle_15)) return;
	
	for (let edgee_i = 0; edgee_i < type - 2; edgee_i += 1) {
		let new_edge = mul(old_edge, Math.cos(angle));
		let orth = {x: old_edge.y, y: -old_edge.x};
		new_edge = sum(new_edge, mul(orth, Math.sin(angle)))
		let new_vx = sum(vx, new_edge);
		
		polygon_vertices.push(new_vx);
		
		vx = new_vx;
		old_edge = new_edge;
	}

    for (let vx_i = 1; vx_i < polygon_vertices.length; vx_i += 1) {
		let vx = polygon_vertices[vx_i];
		
		for (let v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, vertices[v_i].v)) {
				if (vertices[v_i].angle - angle_15 < -0.01) {
					return;
				}
			}
		}
	}
	
	let found;
	
	for (let vx_i = 1; vx_i < polygon_vertices.length; vx_i += 1) {
		let vx = polygon_vertices[vx_i];
		found = false;
		
		for (let v_i = 0; v_i < vertices.length; v_i += 1) {
			if (same_vertex(vx, vertices[v_i].v)) {
				vertices[v_i].angle -= angle_15;
				found = true
			}
		}
		
		if (!found) vertices.push({v: {x: vx.x, y: vx.y}, angle: 24 - angle_15});
	}
	
	let new_polygon = new Polygon(polygon_vertices);

	for (let edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
		for (let edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
			if (edges_intersect(open_edges[edg_i], new_polygon.edges[edge_i])) return;
		}
	}

	for (let edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
		check_close_edge(new_polygon.edges[edge_i]);
	}
	
	polygons.push(new_polygon);
	console.log("Success!")
}

function check_close_edge(edge_to_check: Edge): void {
	let to_push = true;
	for (let edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
		if (same_edge(edge_to_check, open_edges[edg_i])) {
			open_edges.splice(edg_i, 1);
			edg_i -= 1;
			to_push = false;
		}
	}
	if (to_push) open_edges.push(edge_to_check);
}

function add_to_vertex(vertex: Vector, angle_mul_15: number): boolean {
	for (let vx_i = 0; vx_i < vertices.length; vx_i += 1) {
		if (same_vertex(vertex, vertices[vx_i].v)) {
			if (vertices[vx_i].angle - angle_mul_15 < -0.01) {
				return false;
			}

			vertices[vx_i].angle -= angle_mul_15;
			return true;
		}
	}
	
	vertices.push({v: {x: vertex.x, y: vertex.y}, angle: 24 - angle_mul_15});
	return true;
}

function same_vertex(vertex_1: Vector, vertex_2: Vector): boolean {
	let threshold = 0.1;
	if (manhattan(vertex_1, vertex_2) < threshold) return true;
	return false;
}

// The Manhattan distance between two points.
function manhattan(pt1: Vector, pt2: Vector): number {
	return Math.abs(pt1.x - pt2.x) + Math.abs(pt1.y - pt2.y);
}

function same_edge(edge_1: Edge, edge_2: Edge): boolean {
	let threshold = 0.1;
	
	if (manhattan(edge_1.v1, edge_2.v1) < threshold && manhattan(edge_1.v2, edge_2.v2) < threshold) return true;
	if (manhattan(edge_1.v1, edge_2.v2) < threshold && manhattan(edge_1.v2, edge_2.v1) < threshold) return true;
	return false;
}

function edges_intersect(edge_1: Edge, edge_2: Edge): boolean {
    let x1 = edge_1.v1.x;
    let y1 = edge_1.v1.y;
    let x2 = edge_1.v2.x;
    let y2 = edge_1.v2.y;
    
    let x3 = edge_2.v1.x;
    let y3 = edge_2.v1.y;
    let x4 = edge_2.v2.x;
    let y4 = edge_2.v2.y;

    let side1 = (x3 - x1) * (y1 - y2) - (x1 - x2) * (y3 - y1);
    let side2 = (x4 - x1) * (y1 - y2) - (x1 - x2) * (y4 - y1);

    let side3 = (x1 - x3) * (y3 - y4) - (x3 - x4) * (y1 - y3);
    let side4 = (x2 - x3) * (y3 - y4) - (x3 - x4) * (y2 - y3);

    return side1 * side2 < 0 && side3 * side4 < 0;
}

function mouse_down(x: number, y: number): void {
    mouse_is_down = true;
    mouse_down_pos = [x, y];
}

function mouse_up(x: number, y: number): void {
    mouse_is_down = false;
    old_pan_offset_x += pan_offset_x;
    old_pan_offset_y += pan_offset_y;
    pan_offset_x = 0;
    pan_offset_y = 0;
}

function point_inside_polygon(point: Vector, polygon: Polygon): boolean {
	for (let edge_i = 0; edge_i < polygon.edges.length; edge_i += 1) {
		let edge = polygon.edges[edge_i];
		let vec1: Vector = {x: edge.v2.x - edge.v1.x, y: edge.v2.y - edge.v1.y};
		let vec2: Vector = {x: point.x - edge.v1.x, y: point.y - edge.v1.y};

		let determinant = vec1.x * vec2.y - vec1.y * vec2.x;
		if (determinant > 0) return false;
	}

	return true;
}

function mouse_move(x: number, y: number): void {
    if (mouse_is_down) {
        pan_offset_x = x - mouse_down_pos[0];
        pan_offset_y = y - mouse_down_pos[1];
    }
	
	mouse_world_coord = canvas_to_world({x: x, y: y});

	let found: boolean = false;
	for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
		if (point_inside_polygon(mouse_world_coord, polygons[polygon_i])) {
			hovered_polygon = polygons[polygon_i];
			found = true;
			break;
		}
	}
	if (!found) hovered_polygon = undefined;
}

function space_down(): void {
	let edge_i = random_integer(0, open_edges.length);
	// last_edge = new edge(open_edges[edge_i].v1, open_edges[edge_i].v2, undefined);
	add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
}

function mouse_scroll(direction: number): void {
    scale += direction * 0.1;
}

create_foam();