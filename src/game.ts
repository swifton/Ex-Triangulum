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


let test_inner_side_edge: Edge = {v1: {x: 5, y: 5}, v2: {x: 6, y: 6}, polygon1: undefined, polygon2:undefined};
let test_transform_edge_1: Edge = {v1: {x: 5, y: 5}, v2: {x: 6, y: 6}, polygon1: undefined, polygon2:undefined};
let test_transform_edge_2: Edge = {v1: {x: 4, y: 3}, v2: {x: 2, y: 4}, polygon1: undefined, polygon2:undefined};

let candidate_polygon: Polygon = undefined;

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
	
	// Drawing the candidate polygon
    if (candidate_polygon != undefined) {
        main_context.globalAlpha = 0.5;
        main_context.beginPath();
        
        // Move to the last vertex of the polygon
        let last_vx = candidate_polygon.vertices[candidate_polygon.vertices.length - 1];
        let last_vx_canvas = world_to_canvas(last_vx);
        main_context.moveTo(last_vx_canvas.x, last_vx_canvas.y);
        
        // Looping over vertices, drawing the edge to each vertex.
        for (let vx_i = 0; vx_i < candidate_polygon.vertices.length; vx_i += 1) {
            let vx_c = world_to_canvas(candidate_polygon.vertices[vx_i]);
            main_context.lineTo(vx_c.x, vx_c.y);
        }
        
        main_context.fill();
        main_context.stroke();
        main_context.globalAlpha = 1;
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
    
    
	// Drawing an edge for testing the inner side test
	main_context.strokeStyle = "blue";
    
	main_context.beginPath();
    let vx_1c = world_to_canvas(test_inner_side_edge.v1);
    let vx_2c = world_to_canvas(test_inner_side_edge.v2);
    
	main_context.moveTo(vx_1c.x, vx_1c.y);
	main_context.lineTo(vx_2c.x, vx_2c.y);
	main_context.stroke();
    
    
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
    if (point_is_on_line(test_inner_side_edge.v1, test_inner_side_edge.v2, mouse_world_coord)) main_context.fillStyle = "red";
    else main_context.fillStyle = "blue";
    //main_context.fillStyle = "red";
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
        let polygon_i = random_integer(0, polygons.length);
        let polygon = polygons[polygon_i].vertices;
        let vx_i = random_integer(0, polygon.length);
        edge_i = random_integer(0, open_edges.length);
        // last_edge = new edge(open_edges[edge_i].v1, open_edges[edge_i].v2, undefined);
        let edge: Edge = {v1: polygon[vx_i], v2: polygon[(vx_i + 1) % polygon.length], polygon1: polygons[polygon_i], polygon2: undefined};
        //add_polygon(open_edges[edge_i], templates[random_integer(0, templates.length)]);
        add_polygon(edge, templates[random_integer(0, templates.length)]);
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

// Tries to construct a polygon from a given template on the given edge, returns whether it was successful.
// starting_vx_i is the first vertex of the edge that needs to be matched.
function create_candidate_polygon(edge: Edge, p_template: Polygon_Template, starting_vx_i: number): boolean {
    if (starting_vx_i < 0 || starting_vx_i >= p_template.vertices.length) {
        console.log("ERROR: Invalid starting vertex index.");
        return false;
    }
    
    let threshold = 0.01;
    let starting_v1: Vector;
    let starting_v2: Vector;
    
    if (edge.polygon2 == undefined) {
        starting_v1 = edge.v1;
        starting_v2 = edge.v2;
    } else {
        starting_v1 = edge.v2;
        starting_v2 = edge.v1;
    }
    
    for (var polygon of polygons) {
        for (let vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
            let vx1 = polygon.vertices[vx_i];
            let vx2 = polygon.vertices[(vx_i + 1) % polygon.vertices.length];
            if (same_vertex(vx1, starting_v1) && same_vertex(vx2, starting_v2) && polygon != edge.polygon1) return false;
            if (same_vertex(vx1, starting_v2) && same_vertex(vx2, starting_v1) && polygon != edge.polygon1) return false;
        }
    }
    
    let polygon_vertices = [];
    let target_edge: Edge = {v1: starting_v2, v2: starting_v1, polygon1: undefined, polygon2: undefined};
    let first_template_edge: Edge = {v1: p_template.vertices[starting_vx_i], v2: p_template.vertices[(starting_vx_i + 1) % p_template.vertices.length], polygon1: undefined, polygon2: undefined};
    
    if (Math.abs(euclid(first_template_edge.v1, first_template_edge.v2) - euclid(target_edge.v1, target_edge.v2)) > threshold) {
        console.log("ERROR: Can't glue together edges of different lengths.");
        return false;
    }
    
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
    
    // Checking that edges of the new polygon don't intersect with edges 
    // of existing polygons.
    for (let v1_i = 0; v1_i < new_polygon.vertices.length; v1_i += 1) {
        let v1 = new_polygon.vertices[v1_i];
        let v2 = new_polygon.vertices[(v1_i + 1) % new_polygon.vertices.length];
        let edge_to_check:Edge = {v1: v1, v2: v2, polygon1: undefined, polygon2: undefined}
        for (let polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
            let old_polygon = polygons[polygon_i];
            
            for (let v3_i = 0; v3_i < old_polygon.vertices.length; v3_i += 1) {
                let v3 = old_polygon.vertices[v3_i];
                let v4 = old_polygon.vertices[(v3_i + 1) % old_polygon.vertices.length];
                let old_edge_to_check: Edge = {v1: v3, v2: v4, polygon1: undefined, polygon2: undefined}
                if (edges_intersect(edge_to_check, old_edge_to_check)) {
                    console.log("Polygon " + polygon_i + " is in the way.");
                    if (!same_vertex(edge_to_check.v1, old_edge_to_check.v1) && 
                        !same_vertex(edge_to_check.v1, old_edge_to_check.v2) && 
                        !same_vertex(edge_to_check.v2, old_edge_to_check.v1) && 
                        !same_vertex(edge_to_check.v2, old_edge_to_check.v2)) return false;
                    console.log("Exit prevented."); 
                }
            }
        }
    }
    
    /*
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
    */
    
    //polygons.push(new_polygon);
    candidate_polygon = new_polygon;
    console.log("Success!");
    return true;
}

function add_polygon(edge: Edge, p_template: Polygon_Template) {
    if (create_candidate_polygon(edge, p_template, 0)) {
        polygons.push(candidate_polygon);
        candidate_polygon = undefined;
    }
}

function same_vertex(vertex_1: Vector, vertex_2: Vector): boolean {
    let threshold = 0.01;
    if (manhattan(vertex_1, vertex_2) < threshold) return true;
    return false;
}

// The Manhattan distance between two points.
function manhattan(pt1: Vector, pt2: Vector): number {
    return Math.abs(pt1.x - pt2.x) + Math.abs(pt1.y - pt2.y);
}

function same_edge(edge_1: Edge, edge_2: Edge): boolean {
    let threshold = 0.01;
    
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

function segments_intersect(v1: Vector, v2: Vector, v3: Vector, v4: Vector): boolean {
    let x1 = v1.x;
    let y1 = v1.y;
    let x2 = v2.x;
    let y2 = v2.y;
    
    let x3 = v3.x;
    let y3 = v3.y;
    let x4 = v4.x;
    let y4 = v4.y;
    
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

// Tests whether the point is on the line between two points. 
function point_is_on_line(vertex1: Vector, vertex2: Vector, point: Vector): boolean {
    let vec1: Vector = {x: vertex2.x - vertex1.x, y: vertex2.y - vertex1.y};
    let vec2: Vector = {x: point.x - vertex1.x, y: point.y - vertex1.y};
    
    let determinant = vec1.x * vec2.y - vec1.y * vec2.x;
    return Math.abs(determinant) < 0.01;
}

// Finds the intersection of two segments. Assumes that they intersect. Run a check before calling this function.
function segment_intersection(v1: Vector, v2: Vector, v3: Vector, v4: Vector): Vector {
    let threshold = 0.01;
    // Making a system of linear equations for alpha and beta -- parameters that parameterize the lines.
    let w1 = sum(v3, mul(v4, -1));
    let w2 = sum(v2, mul(v1, -1));
    let w3 = sum(v2, mul(v4, -1));
    
    let determinant = w1.x * w2.y - w1.y * w2.x;
    // Degenerate cases -- parallel segments and segments on the same line.
    if (Math.abs(determinant) < threshold) return {x: undefined, y: undefined};
    
    // Solving the system of linear equations.
    let alpha = (1/determinant) * (w2.y * w3.x - w2.x * w3.y);
    let beta = (1/determinant) * (-w1.y * w3.x + w1.x * w3.y);
    
    // The intersection has to be inside both segments.
    if (alpha > 1 - threshold || alpha < threshold) return {x: undefined, y: undefined};
    if (beta > 1 - threshold || beta < threshold) return {x: undefined, y: undefined};
    
    let new_vertex = sum(mul(v3, alpha), mul(v4, 1 - alpha));
    return new_vertex;
}

function cut_polygons(): void {
    let v1 = hovered_vertex;
    let v2 = selected_vertex;
    let w1 = sum(v1, mul(v2, -1));
    
    // Array of polygons that we will add.
    let polygons_vxs: Vector[][] = [];
    
    for (var polygon_i = 0; polygon_i < polygons.length; polygon_i += 1) {
        let polygon = polygons[polygon_i];
        
        // Detecting whether we need to cut the polygon. And if we do, where to cut it.
        // The number is the index of the vertex where the polygon starts or ends.
        // The vector is an additonal vertex to add, if there is any (i.e. the line crosses an edge, and not a vertex).
        let starts: [number, Vector][] = [];
        let ends: [number, Vector][] = [];
        
        for (let vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
            let vx2_i = (vx_i + 1) % polygon.vertices.length;
            let vx1 = polygon.vertices[vx_i];
            let vx2 = polygon.vertices[vx2_i];
            let vx3 = polygon.vertices[(vx_i + 2) % polygon.vertices.length];
            
            if (point_is_on_line(v1, v2, vx2) && segments_intersect(v1, v2, vx1, vx3)) {
                // The line enters or exits the polygon through a vertex.
                if (!point_is_on_line(v1, v2, vx1)) ends.push([vx2_i, undefined]);
                if (!point_is_on_line(v1, v2, vx3)) starts.push([vx2_i, undefined]);
            } else {
                // The line enters or exits the polygon through an edge.
                if (!point_is_on_line(v1, v2, vx1)) {
                    if (segments_intersect(v1, v2, vx1, vx2)) {
                        let intersection = segment_intersection(v1, v2, vx1, vx2);
                        starts.push([vx2_i, intersection]);
                        ends.push([vx_i, intersection]);
                    }
                }
            }
        }
        
        if (starts.length == 0) continue;
        if (starts.length != ends.length) {
            console.log("ERROR: Different start and end lengths, " + starts.length.toString() + ", " + ends.length.toString());
            return;
        }
        
        // Constructing polygons according to the start/end markup we made.
        for (let loop_i = 0; loop_i < starts.length; loop_i  += 1) {
            let start = starts[loop_i];
            let end = ends[(loop_i + 1) % ends.length];
            
            let c_polygon_vxs: Vector[] = [];
            
            // In case if the line enters or exits through an edge.
            if (end[1] != undefined) c_polygon_vxs.push(end[1]);
            if (start[1] != undefined) c_polygon_vxs.push(start[1]);
            
            // Adding the vertices.
            for (let vx_i = start[0]; vx_i != end[0]; vx_i = (vx_i + 1) % polygon.vertices.length) {
                c_polygon_vxs.push(polygon.vertices[vx_i]);
            }
            c_polygon_vxs.push(polygon.vertices[end[0]]);
            
            polygons_vxs.push(c_polygon_vxs);
        }
        
        polygons.splice(polygon_i, 1);
        polygon_i -= 1;
    }
    
    for (var vx_set of polygons_vxs) polygons.push(new Polygon(vx_set));
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
                if (candidate_polygon != undefined) {
                    polygons.push(candidate_polygon);
                    candidate_polygon = undefined;
                }
                // let result = add_polygon(closest_edge, current_template);
                // if (result) closest_edge = undefined;
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
        // Hovering next to a vertex?
        for (var vertex of polygons[polygon_i].vertices) {
            if (euclid(vertex, mouse_world_coord) < 10 / unit_pix) {
                hovered_vertex = vertex;
                found_hovered_vertex = true;
                candidate_polygon = undefined;
                found = true;
            }
        }
        
        // Hovering above a polygon?
        if (point_inside_polygon(mouse_world_coord, polygons[polygon_i])) {
            hovered_polygon = polygons[polygon_i];
            closest_edge = undefined;
            found = true;
            candidate_polygon = undefined;
            break;
        }
    }
    
    if (!found) {
        // Find the closest edge to the cursor, so that we can add a polygon to it.
        hovered_polygon = undefined;
        let min_dist = Number.MAX_VALUE;
        let new_edge = undefined;
        for (var polygon of polygons) {
            for (let vx_i = 0; vx_i < polygon.vertices.length; vx_i += 1) {
                let dist = euclid(mouse_world_coord, polygon.vertices[vx_i]) + euclid(mouse_world_coord, polygon.vertices[(vx_i + 1) % polygon.vertices.length]);
                if (min_dist > dist) {
                    min_dist = dist;
                    new_edge = {v1: polygon.vertices[vx_i], v2: polygon.vertices[(vx_i + 1) % polygon.vertices.length], polygon1: polygon, polygon2: undefined};
                }
                // TODO: Check that there is only one polygon that has this edge.
            }
        }
        
        if (closest_edge == undefined || !same_edge(new_edge, closest_edge) || candidate_polygon == undefined) {
            closest_edge = new_edge;
            create_candidate_polygon(closest_edge, current_template, 2);
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

let first_edge: Edge = {v1: {x: 0, y: 0}, v2: {x: 1, y: 0}, polygon1: undefined, polygon2: undefined};
//create_foam();
add_polygon(first_edge, square_template);