var main_canvas = <HTMLCanvasElement> document.getElementById('canvas');
var main_context = main_canvas.getContext('2d');

function resize_canvas() {
  main_canvas.width = window.innerWidth;
  main_canvas.height = window.innerHeight;
}

function clear_canvas() {
  var canvas = main_canvas;
  var context = canvas.getContext('2d');
  context.fillStyle = '#333333';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.closePath();
  context.fill();
}
