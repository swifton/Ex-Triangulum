let main_canvas = <HTMLCanvasElement> document.getElementById('canvas');
let main_context = main_canvas.getContext('2d');

function resize_canvas(): void {
  main_canvas.width = window.innerWidth;
  main_canvas.height = window.innerHeight;
}

function clear_canvas(): void {
  main_context.fillStyle = '#333333';
  main_context.clearRect(0, 0, main_canvas.width, main_canvas.height);
  main_context.beginPath();
  main_context.rect(0, 0, main_canvas.width, main_canvas.height);
  main_context.closePath();
  main_context.fill();
}
