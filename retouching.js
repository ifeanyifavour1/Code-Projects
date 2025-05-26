let canvas = document.getElementById("canvas"); 
let ctx = canvas.getContext("2d");



// Tool state
let tool = ""; // Can be 'clone', 'blur', or 'spot'

// Clone tool state
let isCloning = false;
let source = { x: 0, y: 0 }; // Stores first click position

// Size of the area to edit (boxSize x boxSize pixels)
let boxSize = 20;

// Get radius input element (assumes you add this input in your HTML)
let radiusInput = document.getElementById("radius-input");

// File upload handler: Draw uploaded image to canvas
document.getElementById("upload").addEventListener("change", function (e) {
  let file = e.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (event) {
    let img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function applySpotRemover(x, y) {
  // Get user radius input and convert to int
  let r = parseInt(radiusInput.value);

  // Validate input: if not a number or less than 1, use default 5
  if (isNaN(r) || r < 1) {
    r = 5;
  }

  // Get the sampling area (2r+1) x (2r+1)
  let sampleSize = 2 * r + 1;
  let imageData = ctx.getImageData(x - r, y - r, sampleSize, sampleSize);
  let data = imageData.data;

  let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;

  // Calculate average color of the sample area
  for (let i = 0; i < data.length; i += 4) {
    rTotal += data[i];
    gTotal += data[i + 1];
    bTotal += data[i + 2];
    count++;
  }

  let avgR = rTotal / count;
  let avgG = gTotal / count;
  let avgB = bTotal / count;

  // Apply average color to a smaller target area (e.g., half the size)
  let targetSize = Math.floor(sampleSize / 2);
  let targetImage = ctx.getImageData(x - Math.floor(targetSize / 2), y - Math.floor(targetSize / 2), targetSize, targetSize);
  let tData = targetImage.data;

  for (let i = 0; i < tData.length; i += 4) {
    tData[i] = avgR;
    tData[i + 1] = avgG;
    tData[i + 2] = avgB;
    // alpha (tData[i + 3]) stays the same
  }

  ctx.putImageData(targetImage, x - Math.floor(targetSize / 2), y - Math.floor(targetSize / 2));
}

canvas.addEventListener("mousedown", function (e) {
  let x = e.offsetX;
  let y = e.offsetY;

  if (tool === "clone") {
    if (!isCloning) {
      source.x = x;
      source.y = y;
      isCloning = true;
      alert("Now click where you want to paste the copied part.");
    } else {
      let copied = ctx.getImageData(source.x, source.y, boxSize, boxSize);
      ctx.putImageData(copied, x, y);
      isCloning = false;
    }
  } else if (tool === "blur") {
    let imageData = ctx.getImageData(x, y, boxSize, boxSize);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    ctx.putImageData(imageData, x, y);
  } else if (tool === "spot") {
    applySpotRemover(x, y);
  }
});
const toolSelect = document.getElementById("tool-select");
const radiusInputElement = document.getElementById("radius-input");

toolSelect.addEventListener("change", function () {
  tool = toolSelect.value;

  if (tool === "spot") {
    radiusInputElement.style.display = "inline-block"; // show radius input
  } else {
    radiusInputElement.style.display = "none"; // hide radius input
  }
});
const downloadBtn = document.getElementById("download-btn");

downloadBtn.addEventListener("click", function () {
  const link = document.createElement("a");
  link.download = "retouched-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});


// Initialize tool and radius input visibility on page load:
tool = toolSelect.value;
radiusInputElement.style.display = (tool === "spot") ? "inline-block" : "none";