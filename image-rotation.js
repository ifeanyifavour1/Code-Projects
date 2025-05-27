const canvas      = document.getElementById('myCanvas');
const ctx         = canvas.getContext('2d');
const input       = document.getElementById('real-file');
const rotateBtn   = document.getElementById('rotate-btn');
const angleInput  = document.getElementById('angle-input');
const downloadBtn = document.getElementById('download-btn');

let image         = new Image();
let rotationAngle = 0; // in degrees

// Download current canvas as PNG
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'rotated-image.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
});

// Handle image upload
input.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    image.src = e.target.result;
    image.onload = () => {
      rotationAngle = 0;
      // initialize canvas to image’s natural size
      canvas.width  = image.width;
      canvas.height = image.height;
      drawImageRotated();
    };
  };
  reader.readAsDataURL(file);
});

// Draw (and resize) for the current rotationAngle
function drawImageRotated() {
  const rad = rotationAngle * Math.PI / 180;

  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const newW = image.width  * cos + image.height * sin;
  const newH = image.width  * sin + image.height * cos;

  canvas.width  = newW;
  canvas.height = newH;

  ctx.clearRect(0, 0, newW, newH);
  ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.restore();

}

// Handle rotate clicks
rotateBtn.addEventListener('click', () => {
  const a = parseFloat(angleInput.value);
  if (isNaN(a)) {
    alert('Enter a valid number!');
    return;
  }
  // accumulate angle, keep within [0,360)
  rotationAngle = (rotationAngle + a) % 360;
  drawImageRotated();
});
