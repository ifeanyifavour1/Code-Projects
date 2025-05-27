const fileInput       = document.getElementById('upload');
const scaleInput      = document.getElementById('scale');
const canvas          = document.getElementById('canvas');
const ctx             = canvas.getContext('2d');
const scaleBtn        = document.getElementById('scale-btn');
const antiAliasToggle = document.getElementById('antialias');
const downloadBtn     = document.getElementById('download-btn');

let image = new Image();

// Image upload
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    image.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Draw uploaded image
image.onload = function() {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

// Image scaling function
function scaleImage() {
  if (!image.src) return alert('Please upload an image first');

  const raw = scaleInput.value;
  const pattern = /^\s*\d+(\.\d+)?\s*$/;
  if (!pattern.test(raw)) {
    return alert('Please enter a valid number (e.g. 1.5)');
  }

  const s = parseFloat(raw);
  const newWidth  = image.naturalWidth * s;
  const newHeight = image.naturalHeight * s;

  canvas.width = newWidth;
  canvas.height = newHeight;

  ctx.imageSmoothingEnabled = antiAliasToggle.checked;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, newWidth, newHeight);
}

// Trigger scale
scaleBtn.addEventListener('click', scaleImage);

// Download logic
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'scaled-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
