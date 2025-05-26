const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('real-file');
const img = new Image();

img.onload = function () {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
};

input.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function applyFilter(type) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filtered = applyColorFilter(imageData, type);
  ctx.putImageData(filtered, 0, 0);
}

// Your algorithm preserved:
function applyColorFilter(imageData, type) {
  const data = imageData.data;

  if (type === "grayscale") {
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const average = (red + green + blue) / 3;
      data[i] = average;
      data[i + 1] = average;
      data[i + 2] = average;
    }
  }

  else if (type === "sepia") {
    const redFactorR = 0.393, redFactorG = 0.769, redFactorB = 0.189;
    const greenFactorR = 0.349, greenFactorG = 0.686, greenFactorB = 0.168;
    const blueFactorR = 0.272, blueFactorG = 0.534, blueFactorB = 0.131;

    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];

      const newRed = redFactorR * red + redFactorG * green + redFactorB * blue;
      const newGreen = greenFactorR * red + greenFactorG * green + greenFactorB * blue;
      const newBlue = blueFactorR * red + blueFactorG * green + blueFactorB * blue;

      data[i] = newRed;
      data[i + 1] = newGreen;
      data[i + 2] = newBlue;
    }
  }
  const downloadBtn = document.getElementById('download-btn');

downloadBtn.addEventListener('click', () => {
  const imageURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageURL;
  link.download = 'filtered-image.png';
  link.click();
});


  return imageData;
}