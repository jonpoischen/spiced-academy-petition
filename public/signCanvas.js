var canvas = document.querySelector('#paint');
var ctx = canvas.getContext('2d');

var sketch = document.querySelector('#sketch');
var sketch_style = getComputedStyle(sketch);

var mouse = {x: 0, y: 0};
var last_mouse = {x: 0, y: 0};

let hasSigned = false;

canvas.addEventListener('mousemove', function(e) {
	last_mouse.x = mouse.x;
	last_mouse.y = mouse.y;

	mouse.x = e.pageX - this.offsetLeft;
	mouse.y = e.pageY - this.offsetTop;
}, false);

ctx.lineWidth = 3;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.strokeStyle = 'black';

canvas.addEventListener('mousedown', function(e) {
	canvas.addEventListener('mousemove', onPaint, false);
}, false);

document.addEventListener('mouseup', function() {
	canvas.removeEventListener('mousemove', onPaint, false);
	if (hasSigned) $('#hid').val(canvas.toDataURL());
}, false);

var onPaint = function() {
	ctx.beginPath();
	ctx.moveTo(last_mouse.x, last_mouse.y);
	ctx.lineTo(mouse.x, mouse.y);
	ctx.closePath();
	ctx.stroke();
	hasSigned = true;
};
