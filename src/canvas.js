var main_canvas = document.getElementById('canvas');
var main_context = main_canvas.getContext('2d');

function resize_canvas(canvas, relative_wid, relative_heit) {
  var relative_wid = relative_wid || 1;
  var relative_heit = relative_heit || 1;
  var canvas = canvas || main_canvas;
  var canvas_wid = window.innerWidth;
  var canvas_heit = window.innerHeight;
  canvas.width = canvas_wid * relative_wid;
  canvas.height = canvas_heit * relative_heit;
}

function clear_canvas(canvas, color) {
  var canvas = canvas || main_canvas;
  context = canvas.getContext('2d');
  context.fillStyle = color || '#333333';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.closePath();
  context.fill();
}

function draw_line(x1, y1, x2, y2, color, thickness, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  var color = color || "black";
  context.beginPath();
  context.lineWidth = thickness || 2;
  context.globalAlpha = opacity;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = color;
  context.stroke();
}

function draw_line_optimized(x1, y1, x2, y2, color, thickness, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  var color = color || "black";
  context.lineWidth = thickness || 2;
  context.globalAlpha = opacity;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = color;
}

function rectangle_optimized(LT, lent, height, color, thickness, opacity, context) {
  var LB = add(LT, [0, height]);
  var RB = add(LB, [lent, 0]);
  var RT = add(LT, [lent, 0]);

  draw_line_optimized(LT[0], LT[1], RT[0], RT[1], color, thickness, opacity, context);
  draw_line_optimized(LB[0], LB[1], RB[0], RB[1], color, thickness, opacity, context);
  draw_line_optimized(LT[0], LT[1], LB[0], LB[1], color, thickness, opacity, context);
  draw_line_optimized(RT[0], RT[1], RB[0], RB[1], color, thickness, opacity, context);
}

function draw_arrow(x1, y1, x2, y2, end, size, wid, color, thickness, opacity, context) {
  // end: 1 - first (x1, y1), 2 - second (x2, y2), 3 - both
  if (end == undefined) end = end || 2;
  if (size == undefined) size = 10;
  wid = wid || 45;
  wid = wid * Math.PI / 180;
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  var color = color || "black";
  context.beginPath();
  context.lineWidth = thickness || 2;
  context.globalAlpha = opacity;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  
  if (end == 1 || end == 3) {
	  var angle = Math.atan2(x2 - x1, y2 - y1);
	  context.moveTo(x1, y1);
	  context.lineTo(x1 + size * Math.sin(angle - wid), y1 + size * Math.cos(angle - wid));
	  context.moveTo(x1, y1);
	  context.lineTo(x1 + size * Math.sin(angle + wid), y1 + size * Math.cos(angle + wid));
  }
  
  if (end == 2 || end == 3) {
	  var angle = Math.atan2(x1 - x2, y1 - y2);
	  context.moveTo(x2, y2);
	  context.lineTo(x2 + size * Math.sin(angle - wid), y2 + size * Math.cos(angle - wid));
	  context.moveTo(x2, y2);
	  context.lineTo(x2 + size * Math.sin(angle + wid), y2 + size * Math.cos(angle + wid));
  }
  
  context.strokeStyle = color;
  context.stroke();
}

function draw_label(label, x, y, color, angle, font_size, context) {
  var angle = angle || 0;
  var context = context || main_context;
  if (font_size == undefined) font_size = 20;
  context.fillStyle = color || "black";
  context.font = "bold " + font_size + "px Arial";
  context.save();
  context.translate(x, y);
  context.rotate(-angle);
  context.fillText(label, 0, 0);
  context.restore();
}

function draw_image(x, y, img, angle, context) {
  var context = context || main_context;
  var angle = angle || 0;
  context.save();
  context.translate(x, y); 
  context.rotate(angle);
  context.drawImage(img, 0, 0); 
  context.restore();
}

function draw_small_image(x, y, img, wid, heit, angle, context) {
  var context = context || main_context;
  var angle = angle || 0;
  context.save();
  context.translate(x, y); 
  context.rotate(angle);
  context.drawImage(img, 0, 0, wid, heit); 
  context.restore();
}

function draw_circle(x, y, r, color, thickness, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  context.beginPath();
  context.strokeStyle = color || "black";
  context.globalAlpha = opacity;
  context.lineWidth = thickness || 2;
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.stroke();
}

function draw_arc(x, y, r, a1, a2, color, thickness, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  context.beginPath();
  context.strokeStyle = color || "black";
  context.globalAlpha = opacity;
  context.lineWidth = thickness || 2;
  context.arc(x, y, r, a1, a2);
  context.stroke();
}

function draw_filled_circle(x, y, r, color, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  context.beginPath();
  context.fillStyle = color || "black";
  context.globalAlpha = opacity;
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.fill();
}

function draw_ellipse(center_x, center_y, radius_x, radius_y, angle, color, thickness, opacity, context) {
	if (opacity == undefined) var opacity = 1;
	var context = context || main_context;
	
	context.beginPath();
	context.strokeStyle = color || "black";
	context.globalAlpha = opacity;
	context.lineWidth = thickness || 2;
	context.ellipse(center_x, center_y, radius_x, radius_y, angle, 0, 2 * Math.PI);
	context.stroke();
}


function draw_filled_rectangle(x1, y1, dx, dy, color, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  context.beginPath();
  context.fillStyle = color || 'black';
  context.globalAlpha = opacity;
  context.fillRect(x1, y1, dx, dy);
  context.fill();
}

function draw_filled_rectangle_optimized(x1, y1, dx, dy, color, opacity, context) {
  if (opacity == undefined) var opacity = 1;
  main_context.fillStyle = color || 'black';
  context.globalAlpha = opacity;
  main_context.fillRect(x1, y1, dx, dy);
}

function draw_pixel(x, y, color, context) {	
	var context = context || main_context;
	var imgData = context.createImageData(1,1);
	
	imgData.data[0] = color[0];
	imgData.data[1] = color[1];
	imgData.data[2] = color[2];
	imgData.data[3] = color[3];
	
	context.putImageData(imgData, x, y);
}

function draw_pixels(pixel_array, size_x, size_y, x, y, context) {
	var context = context || main_context;
	var parr = new Uint8ClampedArray(pixel_array);
	var imgData = new ImageData(parr, size_x, size_y);
	context.putImageData(imgData, x, y);
}