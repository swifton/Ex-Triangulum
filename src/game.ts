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

interface Polygon_Template {
    vertices: Vector[];
}

interface Transformation {
    sin: number;
    cos: number;
    scale: number;
    dx: number;
    dy: number;
}

class Polygon {
	edges: Edge[];
    center: Vector;
    
	constructor(public vertices: Vector[]) {
		this.edges = [];
		for (let vx_i = 0; vx_i < vertices.length; vx_i += 1) {
			// this.edges.push({v1: vertices[vx_i], v2: vertices[(vx_i + 1) % vertices.length], polygon1: this, polygon2: undefined});
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

let unit_pix: number = 200;
let canvas_center = [0, 0];
let polygons: Polygon[] = [];
let open_edges: Edge[] = [];
let edges: Edge[] = [];

let mouse_down_pos: number[];
let pan_offset_x: number = 0;
let pan_offset_y: number = 0;
let old_pan_offset_x: number = 0;
let old_pan_offset_y: number = 0;
let panned = false;

let last_edge: Edge;

let mouse_world_coord: Vector = {x: 0, y: 0};
let hovered_polygon: Polygon = undefined;
let hovered_vertex: Vector = undefined;
let selected_vertex: Vector = undefined;
let closest_edge: Edge = undefined;
let to_add_type = 3;

let debug_edge_1: Vector[] = undefined;
let debug_edge_2: Vector[] = undefined;
let debug_edge_3: Vector[] = undefined;


let triangle_template: Polygon_Template = {vertices: [{x: 0, y: 0}, {x: 0.5, y: Math.sqrt(3)/2}, {x: 1, y: 0}]};

let square_template: Polygon_Template = {vertices: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}]};

let hexagon_template: Polygon_Template = {vertices: [{x: 0, y: 0}, 
                                                     {x: 0.5, y: Math.sqrt(3)/2}, 
                                                     {x: 1.5, y: Math.sqrt(3)/2}, 
                                                     {x: 2, y: 0}, 
                                                     {x: 1.5, y: -Math.sqrt(3)/2},
                                                     {x: 0.5, y: -Math.sqrt(3)/2}]};

let octagon_template: Polygon_Template = {vertices: [{x: 0, y: 0}, 
                                                     {x: 0, y: 1}, 
                                                     {x: Math.sqrt(2) / 2, y: 1 + Math.sqrt(2) / 2}, 
                                                     {x: 1 + Math.sqrt(2) / 2, y: 1 + Math.sqrt(2) / 2}, 
                                                     {x: 1 + Math.sqrt(2), y: 1}, 
                                                     {x: 1 + Math.sqrt(2), y: 0}, 
                                                     {x: 1 + Math.sqrt(2) / 2, y: -Math.sqrt(2) / 2}, 
                                                     {x: Math.sqrt(2) / 2, y: -Math.sqrt(2) / 2}]};

let templates = [triangle_template, square_template, hexagon_template, octagon_template];
let current_template: Polygon_Template = triangle_template;


// let test_inner_side_edge: Edge = {v1: {x: 5, y: 5}, v2: {x: 6, y: 6}, polygon1: undefined, polygon2:undefined};
let test_transform_edge_1: Edge = {v1: {x: 5, y: 5}, v2: {x: 6, y: 6}, polygon1: undefined, polygon2:undefined};
let test_transform_edge_2: Edge = {v1: {x: 4, y: 3}, v2: {x: 2, y: 4}, polygon1: undefined, polygon2:undefined};


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
// Visualizing and labeling the center of the polygon.
        main_context.fillStyle = "orange";
        // main_context.beginPath();
        let canv_v = world_to_canvas(polygon.center);
        main_context.font = '10px serif';
        main_context.fillText(polygon_i.toString(), canv_v.x, canv_v.y);
        // main_context.arc(canv_v.x, canv_v.y, 5, 0, 2 * Math.PI);
        // main_context.fill();
        main_context.fillStyle = "green";
        */
        
        /*
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
	
    /*
	// Drawing the last edge for debugging purposes
	main_context.strokeStyle = "blue";
    
	main_context.beginPath();
	let vx_1c = world_to_canvas(last_edge.v1);
	let vx_2c = world_to_canvas(last_edge.v2);
    
	main_context.moveTo(vx_1c.x, vx_1c.y);
	main_context.lineTo(vx_2c.x, vx_2c.y);
	main_context.stroke();
    */
    
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
    
    /*
	// Drawing edges for testing linear transform
	main_context.strokeStyle = "blue";
    
	main_context.beginPath();
    vx_1c = world_to_canvas(test_transform_edge_1.v1);
    vx_2c = world_to_canvas(test_transform_edge_1.v2);
    
	main_context.moveTo(vx_1c.x, vx_1c.y);
	main_context.lineTo(vx_2c.x, vx_2c.y);
	main_context.stroke();
    
	main_context.strokeStyle = "red";
    
	main_context.beginPath();
    vx_1c = world_to_canvas(test_transform_edge_2.v1);
    vx_2c = world_to_canvas(test_transform_edge_2.v2);
    
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
        main_context.fillStyle = "red";
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
	
    
    // Visualizing poygon1 and polygon2 for each edge for testing and debugging.
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
// Vertex labels for debugging
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
    
    
    // Edge labels for debugging.
    main_context.fillStyle = "orange";
    for (var edge_i = 0; edge_i < open_edges.length; edge_i += 1) {
        let edge = open_edges[edge_i];
        let label_world = mul(sum(edge.v1, edge.v2), 0.5);
        let label_canv = world_to_canvas(label_world);
        main_context.font = '10px serif';
        main_context.fillText(edge_i.toString(), label_canv.x, label_canv.y);
    }
    
    
    /*
// Edges for debugging polygon collisions
    if (debug_edge_1 != undefined) {
        main_context.strokeStyle = "cyan";
        
        main_context.beginPath();
        let vx_1c = world_to_canvas(debug_edge_1[0]);
        let vx_2c = world_to_canvas(debug_edge_1[1]);
        
        main_context.moveTo(vx_1c.x, vx_1c.y);
        main_context.lineTo(vx_2c.x, vx_2c.y);
        main_context.stroke();
        
        main_context.strokeStyle = "blue";
        
        main_context.beginPath();
        vx_1c = world_to_canvas(debug_edge_2[0]);
        vx_2c = world_to_canvas(debug_edge_2[1]);
        
        main_context.moveTo(vx_1c.x, vx_1c.y);
        main_context.lineTo(vx_2c.x, vx_2c.y);
        main_context.stroke();
        
        main_context.strokeStyle = "magenta";
        
        main_context.beginPath();
        vx_1c = world_to_canvas(debug_edge_3[0]);
        vx_2c = world_to_canvas(debug_edge_3[1]);
        
        main_context.moveTo(vx_1c.x, vx_1c.y);
        main_context.lineTo(vx_2c.x, vx_2c.y);
        main_context.stroke();
        
    }
    */
    
    // Visualizing the hovered vertex
    if (hovered_vertex != undefined) {
        main_context.fillStyle = "yellow";
        main_context.beginPath();
        let canv_v = world_to_canvas(hovered_vertex);
        main_context.arc(canv_v.x, canv_v.y, 5, 0, 2 * Math.PI);
        main_context.fill();
    }
    
    // Visualizing the selected vertex
    if (selected_vertex != undefined) {
        main_context.fillStyle = "yellow";
        main_context.beginPath();
        let canv_v = world_to_canvas(selected_vertex);
        main_context.arc(canv_v.x, canv_v.y, 5, 0, 2 * Math.PI);
        main_context.fill();
    }
    
    // Visualizing the line by which the polygons will be cut.
    if (hovered_vertex != undefined && selected_vertex != undefined) {
        main_context.strokeStyle = "blue";
        let selected_c = world_to_canvas(selected_vertex);
        let hovered_c = world_to_canvas(hovered_vertex);
        main_context.beginPath();
        main_context.moveTo(selected_c.x, selected_c.y);
        main_context.lineTo(hovered_c.x, hovered_c.y);
        main_context.stroke();
    }
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
    add_polygon(first_edge, triangle_template);
    
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
        add_polygon(open_edges[edge_i], templates[random_integer(0, templates.length)]);
    }
    
    let transformation = find_transformation(test_transform_edge_1, test_transform_edge_2);
    
    test_transform_edge_1.v1 = transform(test_transform_edge_1.v1, transformation);
    test_transform_edge_1.v2 = transform(test_transform_edge_1.v2, transformation);
    
    test_transform_edge_1.v1.x += 0.1;
    test_transform_edge_1.v2.x += 0.1;
    
}

// Finds a linear transformation that transforms edge_1 into edge_2
function find_transformation(edge_1: Edge, edge_2: Edge): Transformation {
    let xt1 = edge_1.v1.x;
    let yt1 = edge_1.v1.y;
    let xt2 = edge_1.v2.x;
    let yt2 = edge_1.v2.y;
    
    let xe1 = edge_2.v1.x;
    let ye1 = edge_2.v1.y;
    let xe2 = edge_2.v2.x;
    let ye2 = edge_2.v2.y;
    
    let len_t = euclid(edge_1.v1, edge_1.v2);
    let len_e = euclid(edge_2.v1, edge_2.v2);
    
    let sin_a_t = (yt2 - yt1) / len_t;
    let cos_a_t = (xt2 - xt1) / len_t;
    
    let sin_a_e = (ye2 - ye1) / len_e;
    let cos_a_e = (xe2 - xe1) / len_e;
    
    let sin_a = sin_a_e * cos_a_t - cos_a_e * sin_a_t;
    let cos_a = cos_a_e * cos_a_t + sin_a_e * sin_a_t;
    
    let result: Transformation = {sin: sin_a, cos: cos_a, scale: len_e / len_t, dx: 0, dy: 0};
    let intermediary_v1 = transform(edge_1.v1, result);
    result.dx = edge_2.v1.x - intermediary_v1.x;
    result.dy = edge_2.v1.y - intermediary_v1.y;
    
    return result;
}

// Applies a linear transformation to a point.
function transform(point: Vector, transformation: Transformation): Vector {
    let x_new = transformation.scale * (point.x * transformation.cos - point.y * transformation.sin) + transformation.dx;
    let y_new = transformation.scale * (point.x * transformation.sin + point.y * transformation.cos) + transformation.dy;
    
    return {x: x_new, y: y_new};
}

function add_polygon(edge: Edge, p_template: Polygon_Template): boolean {
    let starting_v1: Vector;
    let starting_v2: Vector;
    
    if (edge.polygon2 == undefined) {
        starting_v1 = edge.v1;
        starting_v2 = edge.v2;
    } else {
        starting_v1 = edge.v2;
        starting_v2 = edge.v1;
    }
    
    let polygon_vertices = [];
    let target_edge: Edge = {v1: starting_v2, v2: starting_v1, polygon1: undefined, polygon2: undefined};
    let first_template_edge: Edge = {v1: p_template.vertices[0], v2: p_template.vertices[1], polygon1: undefined, polygon2: undefined};
    let transformation = find_transformation(first_template_edge, target_edge);
    
    for (let vertex_i = 0; vertex_i < p_template.vertices.length; vertex_i += 1) {
        let p_vertex = transform(p_template.vertices[vertex_i], transformation);
        polygon_vertices.push(p_vertex);
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
                    
                    // This code checks that the new polygon won't intersect with old polygons. This code is difficult to understand, 
                    // maintain and debug. It should be replaced with something else.
                    if (point_is_on_inner_side(this_prev, this_vx, that_prev) && point_is_on_inner_side(this_vx, this_next, that_prev)) {
                        console.log("1Vertex collision"); 
                        debug_edge_1 = [this_prev, this_vx];
                        debug_edge_2 = [this_vx, this_next];
                        debug_edge_3 = [that_vx, that_prev];
                        
                        if (!same_vertex(this_prev, that_prev) && !same_vertex(this_next, that_prev)) return false;
                        console.log("Exit prevented."); 
                    }
                    if (point_is_on_inner_side(this_prev, this_vx, that_next) && point_is_on_inner_side(this_vx, this_next, that_next)) {
                        console.log("Vertex collision");
                        if (!same_vertex(this_prev, that_next) && !same_vertex(this_next, that_next)) return false;
                        console.log("Exit prevented."); 
                    }
                    
                    if (point_is_on_inner_side(that_prev, that_vx, this_prev) && point_is_on_inner_side(that_vx, that_next, this_prev)) {
                        console.log("Vertex collision"); 
                        if (!same_vertex(that_prev, this_prev) && !same_vertex(that_next, this_prev)) return false;
                        console.log("Exit prevented."); 
                    }
                    if (point_is_on_inner_side(that_prev, that_vx, this_next) && point_is_on_inner_side(that_vx, that_next, this_next)) {
                        console.log("Vertex collision"); 
                        if (!same_vertex(that_prev, this_next) && !same_vertex(that_next, this_next)) return false;
                        console.log("Exit prevented."); 
                    }
                }
            }
        }
    }
    
    let new_polygon = new Polygon(polygon_vertices);
    
    // Checking that edges of the new polygon don't intersect with outer edges 
    // of existing polygons.
    for (let edge_i = 0; edge_i < new_polygon.edges.length; edge_i += 1) {
        for (let edg_i = 0; edg_i < open_edges.length; edg_i += 1) {
            let edg = open_edges[edg_i];
            let edge = new_polygon.edges[edge_i];
            if (edges_intersect(edg, edge)) {
                console.log("Edge " + edg_i + " is in the way.");
                if (!same_vertex(edge.v1, edg.v1) && !same_vertex(edge.v1, edg.v2) && !same_vertex(edge.v2, edg.v1) && !same_vertex(edge.v2, edg.v2)) return false;
                console.log("Exit prevented."); 
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

function cut_polygons(): void {
    // The vertex to cut the edge at, the edge index in the 'edges' array, the distance to v1.
    let to_cut: [Vector, number, number][] = [];
    let threshold = 0.1;
    
    let v1 = hovered_vertex;
    let v2 = selected_vertex;
    let w1 = sum(v1, mul(v2, -1));
    
    // Detecting which edges intersect with the line given by selected vertices.
    for (let edge_i = 0; edge_i < edges.length; edge_i += 1) {
        // Looking for the intersection.
        let edge = edges[edge_i];
        // Making a system of linear equations for alpha and beta -- parameters that parameterize the lines.
        let w2 = sum(edge.v2, mul(edge.v1, -1));
        let w3 = sum(edge.v2, mul(v2, -1));
        
        let determinant = w1.x * w2.y - w1.y * w2.x;
        // Degenerate cases -- parallel segments and segments on the same line.
        if (Math.abs(determinant) < threshold) continue;
        
        // Solving the system of linear equations.
        let alpha = (1/determinant) * (w2.y * w3.x - w2.x * w3.y);
        let beta = (1/determinant) * (-w1.y * w3.x + w1.x * w3.y);
        
        // The intersection has to be inside both segments.
        if (alpha > 1 - threshold || alpha < threshold) continue;
        if (beta > 1 - threshold || beta < threshold) continue;
        
        let new_vertex = sum(mul(v1, alpha), mul(v2, 1 - alpha));
        to_cut.push([new_vertex, edge_i, euclid(new_vertex, v1)]);
    }
    
    to_cut.push([v2, undefined, euclid(v2, v1)]);
    to_cut.push([v1, undefined, 0]);
    
    // Sorting by distance to v1 in ascending order.
    to_cut.sort(function compare(a, b) {return a[2] - b[2]});
    
    // Cutting all polygons that the line intersects.
    let old_tup = to_cut[0];
    let old_edges = undefined;
    for (var tup_i = 1; tup_i < to_cut.length; tup_i += 1) {
        let tup = to_cut[tup_i];
        let old_v: Vector = old_tup[0];
        //open_edges.push({v1: {x: old_v.x, y: old_v.y}, v2: tup[0], polygon1: undefined, polygon2: undefined});
        let polygon_1_vxs = [];
        let polygon_2_vxs = [];
        
        if (tup[1] != undefined) {
            let edge = edges[tup[1]];
            //open_edges.push({v1: {x: edge.v1.x, y: edge.v1.y}, v2: tup[0], polygon1: undefined, polygon2: undefined});
            //open_edges.push({v1: {x: edge.v2.x, y: edge.v2.y}, v2: tup[0], polygon1: undefined, polygon2: undefined});
        }
        
        // Case 1: The line enters and exits a polygon through an edge.
        if (tup[1] != undefined && old_tup[1] != undefined) {
            let polygon_to_cut: Polygon;
            let edge_1 = edges[tup[1]];
            let edge_2 = edges[old_tup[1]];
            
            polygon_1_vxs = [{x: tup[0].x, y: tup[0].y}];
            polygon_2_vxs = [{x: old_tup[0].x, y: old_tup[0].y}];
            let start_1: Vector; // The first vertex of the first polygon (other than the new vx).
            let end_1: Vector;   // The last vertex.
            let start_2: Vector;
            let end_2: Vector;
            
            if (edge_1.polygon1 == edge_2.polygon1) {
                console.log("Case 1");
                polygon_to_cut = edge_1.polygon1;
                start_1 = edge_1.v2;
                end_2   = edge_1.v1;
                end_1   = edge_2.v1;
                start_2 = edge_2.v2;
            } else if (edge_1.polygon1 == edge_2.polygon2) {
                console.log("Case 2");
                polygon_to_cut = edge_1.polygon1;
                start_1 = edge_1.v2;
                end_2   = edge_1.v1;
                end_1   = edge_2.v2;
                start_2 = edge_2.v1;
            } else if (edge_1.polygon2 == edge_2.polygon1) {
                console.log("Case 3");
                polygon_to_cut = edge_1.polygon2;
                start_1 = edge_1.v1;
                end_2   = edge_1.v2;
                end_1   = edge_2.v1;
                start_2 = edge_2.v2;
            } else if (edge_1.polygon2 == edge_2.polygon2) {
                console.log("Case 4");
                polygon_to_cut = edge_1.polygon2;
                start_1 = edge_1.v1;
                end_2   = edge_1.v2;
                end_1   = edge_2.v2;
                start_2 = edge_2.v1;
            } else console.log("ERROR: The edges don't have a polygon in common.");
            
            // Adding the vertices to polygons.
            let start_i: number = polygon_to_cut.vertices.findIndex(v => same_vertex(v, start_1));
            for (;!same_vertex(polygon_to_cut.vertices[start_i], end_1); start_i = (start_i + 1) % polygon_to_cut.vertices.length) {
                polygon_1_vxs.push(polygon_to_cut.vertices[start_i]);
            }
            polygon_1_vxs.push(end_1);
            polygon_1_vxs.push({x: old_tup[0].x, y: old_tup[0].y});
            
            start_i = polygon_to_cut.vertices.findIndex(v => same_vertex(v, start_2));
            for (;!same_vertex(polygon_to_cut.vertices[start_i], end_2); start_i = (start_i + 1) % polygon_to_cut.vertices.length) {
                polygon_2_vxs.push(polygon_to_cut.vertices[start_i]);
            }
            polygon_2_vxs.push(end_2);
            polygon_2_vxs.push({x: tup[0].x, y: tup[0].y});
            
            let new_polygon_1 = new Polygon(polygon_1_vxs);
            let new_polygon_2 = new Polygon(polygon_2_vxs);
            polygons.push(new_polygon_1);
            polygons.push(new_polygon_2);
            
            // Reassigning edges
            start_i = polygon_to_cut.vertices.findIndex(v => same_vertex(v, start_1));
            for (var n_edges = 0; n_edges < polygon_1_vxs.length - 3; start_i = (start_i + 1) % polygon_to_cut.vertices.length) {
                n_edges += 1;
                if (polygon_to_cut.edges[start_i].polygon1 == polygon_to_cut) polygon_to_cut.edges[start_i].polygon1 = new_polygon_1;
                if (polygon_to_cut.edges[start_i].polygon2 == polygon_to_cut) polygon_to_cut.edges[start_i].polygon2 = new_polygon_1;
            }
            
            start_i = polygon_to_cut.vertices.findIndex(v => same_vertex(v, start_2));
            for (var n_edges = 0; n_edges < polygon_2_vxs.length - 3; start_i = (start_i + 1) % polygon_to_cut.vertices.length) {
                n_edges += 1;
                if (polygon_to_cut.edges[start_i].polygon1 == polygon_to_cut) polygon_to_cut.edges[start_i].polygon1 = new_polygon_2;
                if (polygon_to_cut.edges[start_i].polygon2 == polygon_to_cut) polygon_to_cut.edges[start_i].polygon2 = new_polygon_2;
            }
            
            // Deleting the old polygon
            for (var polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
                if (polygons[polygon_i] == polygon_to_cut) {
                    polygons.splice(polygon_i, 1);
                    break;
                }
            }
            
            // Deleting the old edges
            for (var edge_i = 0; edge_i < edges.length; edge_i += 1) {
                if (edges[edge_i] == edge_2) {
                    edges.splice(edge_i, 1);
                    break;
                }
            }
        }
        
        old_tup = tup;
    }
    
    console.log(polygons);
}

function mouse_up(x: number, y: number): void {
    mouse_is_down = false;
    old_pan_offset_x += pan_offset_x;
    old_pan_offset_y += pan_offset_y;
    pan_offset_x = 0;
    pan_offset_y = 0;
    
    if (!panned) {
        if (hovered_vertex != undefined) {
            if (selected_vertex == undefined) {
                selected_vertex = hovered_vertex;
            } else {
                cut_polygons();
                selected_vertex = undefined;
                hovered_vertex = undefined;
            }
        } else {
            if (closest_edge != undefined) {
                let result = add_polygon(closest_edge, current_template);
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
    
    let found_hovered_vertex = false;
    
    let found: boolean = false;
    for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
        for (var vertex of polygons[polygon_i].vertices) {
            if (euclid(vertex, mouse_world_coord) < 10 / unit_pix) {
                hovered_vertex = vertex;
                found_hovered_vertex = true;
            }
        }
        
        
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
        for (var polygon of polygons) {
            for (let vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
                let dist = euclid(mouse_world_coord, polygon.vertices[vx_i]) + euclid(mouse_world_coord, polygon.vertices[(vx_i + 1) % polygon.vertices.length]);
                if (min_dist > dist) {
                    min_dist = dist;
                    closest_edge = {v1: polygon.vertices[vx_i], v2: polygon.vertices[(vx_i + 1) % polygon.vertices.length], polygon1: polygon, polygon2: undefined};
                }
            }
        }
    }
    
    if (!found_hovered_vertex) hovered_vertex = undefined;
}

function space_down(): void {
    if (hovered_polygon != undefined) {
        current_template = {vertices: hovered_polygon.vertices};
    }
}

function mouse_scroll(direction: number): void {
    unit_pix += direction * 10;
}

//create_foam();
let first_edge: Edge = {v1: {x: 0, y: 0}, v2: {x: 1, y: 0}, polygon1: undefined, polygon2: undefined};
add_polygon(first_edge, triangle_template);