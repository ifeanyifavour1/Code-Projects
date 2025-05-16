const fileInput = document.getElementById('upload');
const scaleInput = document.getElementById('scale');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scaleBtn = document.getElementById('scale-btn');
const antiAliasToggle = document.getElementById('antialias');

let image = new Image();

// Image upload handling
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    image.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Image loading handling
image.onload = function() {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

// Scaling function
function scaleImage() {
  if (!image.src) return alert('Please upload an image first');
  
  const scaleValue = parseFloat(scaleInput.value);
  if (isNaN(scaleValue)) return alert('Invalid scale value');
  
  const newWidth = image.naturalWidth * scaleValue;
  const newHeight = image.naturalHeight * scaleValue;

  // Set canvas dimensions
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Apply scaling with anti-aliasing
  ctx.imageSmoothingEnabled = antiAliasToggle.checked;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, newWidth, newHeight);
}

// Event listener for scaling
scaleBtn.addEventListener('click', scaleImage);