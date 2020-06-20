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
    center: Vector;
    
	constructor(public vertices: Vector[]) {
		this.edges = [];
		for (let vx_i = 0; vx_i < vertices.length; vx_i += 1) {
			this.edges.push({v1: vertices[vx_i], v2: vertices[(vx_i + 1) % vertices.length], polygon1: this, polygon2: undefined});
		}
        
        this.center = {x: 0, y: 0}
        for (var vertex of vertices) {
            this.center = sum(this.center, vertex);
        }
        
        this.center.x /= vertices.length;
        this.center.y /= vertices.length;
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
let edges: Edge[] = [];
// let vertices: Vertex[] = [];

let colors: String[] = ["red", "green", "blue", "yellow", "magenta", "cyan"];
let types: number[] = [3, 4, 6, 8];

let mouse_down_pos: number[];
let pan_offset_x: number = 0;
let pan_offset_y: number = 0;
let old_pan_offset_x: number = 0;
let old_pan_offset_y: number = 0;
let scale: number = 1;
let panned = false;

let last_edge: Edge;

let mouse_world_coord: Vector = {x: 0, y: 0};
let hovered_polygon: Polygon = undefined;
let closest_edge: Edge = undefined;
let to_add_type = 3;

// let test_inner_side_edge: Edge = {v1: {x: 5, y: 5}, v2: {x: 6, y: 6}, polygon1: undefined, polygon2:undefined};

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
        
        /*
        main_context.fillStyle = "orange";
        main_context.beginPath();
        let canv_v = world_to_canvas(polygon.center);
        main_context.arc(canv_v.x, canv_v.y, 5, 0, 2 * Math.PI);
        main_context.fill();
        main_context.fillStyle = "green";
        */
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
    
    /*
	// Drawing an edge for testing the inner side test
	main_context.strokeStyle = "blue";
    
	main_context.beginPath();
    vx_1c = world_to_canvas(test_inner_side_edge.v1);
    vx_2c = world_to_canvas(test_inner_side_edge.v2);
    
	main_context.moveTo(vx_1c.x, vx_1c.y);
	main_context.lineTo(vx_2c.x, vx_2c.y);
	main_context.stroke();
    */
    
	// Visualizing the mouse position.
	// if (point_is_on_inner_side(test_inner_side_edge.v1, test_inner_side_edge.v2, mouse_world_coord)) main_context.fillStyle = "red";
    // else main_context.fillStyle = "blue";
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
	
    for (var edge of edges) {
        
        let edge_center = sum(edge.v1, edge.v2);
        edge_center =  mul(edge_center, 0.5);
        let vx_1c = world_to_canvas(edge_center);
        
        if (edge.polygon1 != undefined) {
            let polygon_center = edge.polygon1.center;
            main_context.strokeStyle = "magenta";
            main_context.beginPath();
            let vx_2c = world_to_canvas(polygon_center);
            
            main_context.moveTo(vx_1c.x, vx_1c.y);
            main_context.lineTo(vx_2c.x, vx_2c.y);
            main_context.stroke();
        }
        
        if (edge.polygon2 != undefined) {
            let polygon_center = edge.polygon2.center;
            main_context.strokeStyle = "brown";
            main_context.beginPath();
            let vx_2c = world_to_canvas(polygon_center);
            
            main_context.moveTo(vx_1c.x, vx_1c.y);
            main_context.lineTo(vx_2c.x, vx_2c.y);
            main_context.stroke();
        }
    }
    
	if (closest_edge != undefined) {
        // Drawing the edge closest to the mouse
        main_context.strokeStyle = "cyan";
        
        main_context.beginPath();
        let vx_1c = world_to_canvas(closest_edge.v1);
        let vx_2c = world_to_canvas(closest_edge.v2);
        
        main_context.moveTo(vx_1c.x, vx_1c.y);
        main_context.lineTo(vx_2c.x, vx_2c.y);
        main_context.stroke();
    }
    
    /*
    main_context.fillStyle = "orange";
    for (var vertex_i in vertices) {
        let vertex = vertices[vertex_i];
        main_context.beginPath();
        let canv_v = world_to_canvas(vertex.v);
        main_context.arc(canv_v.x, canv_v.y, 5, 0, 2 * Math.PI);
        main_context.fill();
        
        main_context.font = '10px serif';
        main_context.fillText(vertex_i, canv_v.x, canv_v.y);
    }
    */
    
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
		edges.push(first_polygon.edges[edge_i]);
	}
    
	last_edge = first_polygon.edges[0];
    
	for (let polygon_i = 0; polygon_i < 1000; polygon_i += 1) {
		edge_i = random_integer(0, open_edges.length);
		// last_edge = new edge(open_edges[edge_i].v1, open_edges[edge_i].v2, undefined);
		add_polygon(open_edges[edge_i], types[random_integer(0, types.length)]);
	}
}

function add_polygon(edge: Edge, type: number): boolean {
    let starting_v1: Vector;
    let starting_v2: Vector;
    
    if (edge.polygon2 == undefined) {
        starting_v1 = edge.v1;
        starting_v2 = edge.v2;
    } else {
        starting_v1 = edge.v2;
        starting_v2 = edge.v1;
    }
    
    let old_edge = {x: starting_v1.x - starting_v2.x, y: starting_v1.y - starting_v2.y};
	let polygon_vertices = [starting_v2, starting_v1];
	let angle = Math.PI * (1 - (type - 2) / type);
	let vx = starting_v1;
	let angle_15 = 12 * (type - 2) / type;
	
    // Constructing the vertices of the future polygon.
	for (let edgee_i = 0; edgee_i < type - 2; edgee_i += 1) {
		let new_edge = mul(old_edge, Math.cos(angle));
		let orth = {x: old_edge.y, y: -old_edge.x};
		new_edge = sum(new_edge, mul(orth, Math.sin(angle)))
            let new_vx = sum(vx, new_edge);
		
		polygon_vertices.push(new_vx);
		
		vx = new_vx;
		old_edge = new_edge;
	}
    
    // Checking that each vertex has enough space around it for the polygon.
    for (let vx_i = 1; vx_i < polygon_vertices.length; vx_i += 1) {
		let this_vx = polygon_vertices[vx_i];
        
        for (var that_polygon of polygons) {
            for (let that_vx_i = 0; that_vx_i < that_polygon.vertices.length; that_vx_i += 1) {
                let that_vx = that_polygon.vertices[that_vx_i];
                if (same_vertex(this_vx, that_vx)) {
                    let this_next = polygon_vertices[(vx_i + 1) % polygon_vertices.length];
                    let prev_i = vx_i - 1;
                    if (prev_i == -1) prev_i = polygon_vertices.length - 1;
                    let this_prev = polygon_vertices[prev_i];
                    
                    let that_next = that_polygon.vertices[(that_vx_i + 1) % that_polygon.vertices.length];
                    prev_i = that_vx_i - 1;
                    if (prev_i == -1) prev_i = that_polygon.vertices.length - 1;
                    let that_prev = that_polygon.vertices[prev_i];
                    
                    if (point_is_on_inner_side(this_prev, this_vx, that_prev) && point_is_on_inner_side(this_vx, this_next, that_prev)) return false;
                    if (point_is_on_inner_side(this_prev, this_vx, that_next) && point_is_on_inner_side(this_vx, this_next, that_next)) return false;
                    
                    if (point_is_on_inner_side(that_prev, that_vx, this_prev) && point_is_on_inner_side(that_vx, that_next, this_prev)) return false;
                    if (point_is_on_inner_side(that_prev, that_vx, this_next) && point_is_on_inner_side(that_vx, that_next, this_next)) return false;
                }
            }
        }
	}
	
	let new_polygon = new Polygon(polygon_vertices);
    
    // Checking that edges of the new polygon don't intersect with outer edges 
    // of existing polygons.
	for (let edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
		for (let edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
			if (edges_intersect(open_edges[edg_i], new_polygon.edges[edge_i])) {
                // console.log("Edge " + edg_i + " is in the way.");
                return false;
            }
		}
	}
    
    // If some of the edges coincide with existing edges, pick the existing edge instead
    // of creating a new one. Make it unavailable for new polygons.
	for (let edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
        let edge_to_check = new_polygon.edges[edge_i];
        let found  = false;
        for (let edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
            if (same_edge(edge_to_check, open_edges[edg_i])) {
                if (open_edges[edg_i].polygon2 == undefined) open_edges[edg_i].polygon2 = new_polygon;
                else open_edges[edg_i].polygon1 = new_polygon;
                new_polygon.edges[edge_i] = open_edges[edg_i];
                open_edges.splice(edg_i, 1);
                found = true;
                break;
            }
        }
        
        if (!found) {
            open_edges.push(edge_to_check);
            edges.push(edge_to_check);
        }
    }
	
	polygons.push(new_polygon);
	console.log("Success!");
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
    panned = false;
}

function remove_by_value(array: any, element: any): void {
    for (let element_i = 0; element_i < array.length; element_i += 1) {
        if (array[element_i] == element) {
            array.splice(element_i, 1);
            return;
        }
    }
}

function mouse_up(x: number, y: number): void {
    mouse_is_down = false;
    old_pan_offset_x += pan_offset_x;
    old_pan_offset_y += pan_offset_y;
    pan_offset_x = 0;
    pan_offset_y = 0;
    
    if (!panned) {
        if (closest_edge != undefined) {
            let result = add_polygon(closest_edge, to_add_type);
            if (result) closest_edge = undefined;
        }
        
        if (hovered_polygon != undefined) {
            for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
                if (polygons[polygon_i] === hovered_polygon) {
                    polygons.splice(polygon_i, 1);
                    
                    for (var edge of hovered_polygon.edges) {
                        if (edge.polygon1 === hovered_polygon) edge.polygon1 = undefined;
                        if (edge.polygon2 === hovered_polygon) edge.polygon2 = undefined;
                        
                        if (edge.polygon1 == undefined && edge.polygon2 == undefined) {
                            remove_by_value(edges, edge);
                            remove_by_value(open_edges, edge);
                        } else {
                            open_edges.push(edge);
                        }
                    }
                    
                    hovered_polygon = undefined;
                    break;
                }
            }
        }
    }
}

// Tests whether the point is on a certain side of the edge. This function only makes
// sense in the context of how polygons are constructed. 
function point_is_on_inner_side(vertex1: Vector, vertex2: Vector, point: Vector): boolean {
    let vec1: Vector = {x: vertex2.x - vertex1.x, y: vertex2.y - vertex1.y};
    let vec2: Vector = {x: point.x - vertex1.x, y: point.y - vertex1.y};
    
    let determinant = vec1.x * vec2.y - vec1.y * vec2.x;
    return determinant < 0;
}

function point_inside_polygon(point: Vector, polygon: Polygon): boolean {
	for (let vertex_i = 0; vertex_i < polygon.vertices.length; vertex_i += 1) {
        let vertex = polygon.vertices[vertex_i];
        let next_vertex = polygon.vertices[(vertex_i + 1) % polygon.vertices.length];
        
		if (!point_is_on_inner_side(vertex, next_vertex, point)) return false;
	}
    
	return true;
}

// The Euclid distance between two points.
function euclid(p1: Vector, p2: Vector):number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function mouse_move(x: number, y: number): void {
    if (mouse_is_down) {
        pan_offset_x = x - mouse_down_pos[0];
        pan_offset_y = y - mouse_down_pos[1];
        panned = true;
    }
	
	mouse_world_coord = canvas_to_world({x: x, y: y});
    
	let found: boolean = false;
	for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
		if (point_inside_polygon(mouse_world_coord, polygons[polygon_i])) {
			hovered_polygon = polygons[polygon_i];
            closest_edge = undefined;
			found = true;
			break;
		}
	}
	
	if (!found) {
		hovered_polygon = undefined;
        let min_dist = Number.MAX_VALUE;
        for (var edge of open_edges) {
            let dist = euclid(mouse_world_coord, edge.v1) + euclid(mouse_world_coord, edge.v2);
            if (min_dist > dist) {
                min_dist = dist;
                closest_edge = edge;
            }
        }
	}
}

function space_down(): void {
	if (hovered_polygon != undefined) {
        to_add_type = hovered_polygon.vertices.length;
    }
}

function mouse_scroll(direction: number): void {
    scale += direction * 0.1;
}

create_foam();
