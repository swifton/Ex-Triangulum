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
