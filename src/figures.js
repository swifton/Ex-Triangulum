function line(start, end, color, thickness, opacity, context) {
  draw_line(start[0], start[1], end[0], end[1], color, thickness, opacity, context);
}

function tetragon(LT, RT, LB, RB, color, thickness, opacity, context) {
  line(LT, RT, color, thickness, opacity, context);
  line(LB, RB, color, thickness, opacity, context);
  line(LT, LB, color, thickness, opacity, context);
  line(RT, RB, color, thickness, opacity, context);
}

function rectangle(LT, lent, height, color, thickness, opacity, context) {
  var LB = add(LT, [0, height]);
  var RB = add(LB, [lent, 0]);
  var RT = add(LT, [lent, 0]);

  tetragon(LT, RT, LB, RB, color, thickness, opacity, context);
}

function draw_line_texture(color, thickness, opacity, center_x, center_y, angle, wid, lent, gap, context) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  var color = color || "black";
  context.globalAlpha = opacity;
  context.beginPath();
  context.lineWidth = thickness || 2;
  context.strokeStyle = color;
  
  var orthogonal_angle = angle + Math.PI / 2;
  
  for (var i = Math.floor(-wid / (2 * gap)); i < wid / (2 * gap); i++) {
	line_center = add([center_x, center_y], [i * gap * Math.cos(orthogonal_angle), i * gap * Math.sin(orthogonal_angle)]);
	start = add(line_center, [-lent * Math.cos(angle), -lent * Math.sin(angle)]);
	end = add(line_center, [lent * Math.cos(angle), lent * Math.sin(angle)]);
	context.moveTo(start[0], start[1]);
	context.lineTo(end[0], end[1]);
  }
  
  context.stroke();
}

function draw_cut_line_texture(color, thickness, opacity, line_array, center_x, center_y, scale) {
  if (opacity == undefined) var opacity = 1;
  var context = context || main_context;
  var color = color || "black";
  context.globalAlpha = opacity;
  context.beginPath();
  context.lineWidth = thickness || 2;
  context.strokeStyle = color;
  
  for (var i = 0; i < line_array.length / 4; i++) {
	context.moveTo(center_x + scale * line_array[4 * i], center_y + scale * line_array[4 * i + 1]);
	context.lineTo(center_x + scale * line_array[4 * i + 2], center_y + scale * line_array[4 * i + 3]);
  }
  
  context.stroke();
}









