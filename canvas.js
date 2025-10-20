const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

let drawing = false;

// Start drawing when mouse is pressed
canvas.addEventListener('mousedown', () => { drawing = true; });

// Stop drawing when mouse is released or leaves canvas
canvas.addEventListener('mouseup', () => {
  drawing = false;
  ctx.beginPath();
});
canvas.addEventListener('mouseleave', () => {
  drawing = false;
  ctx.beginPath();
});

// Draw as the mouse moves
canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = 'round';
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

// Clear canvas button
clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
