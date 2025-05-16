let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// Tool state
let tool = ""; // Will be 'clone', 'blur', or 'spot'

// Clone tool state
let isCloning = false;
let source = { x: 0, y: 0 }; // Stores first click position

// Size of the area to edit (boxSize x boxSize pixels)
let boxSize = 20;

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
      ctx.drawImage(img, 0, 0); // Draw image onto canvas
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// When the user clicks on canvas
canvas.addEventListener("mousedown", function (e) {
  let x = e.offsetX;
  let y = e.offsetY;

  // 1. Clone Tool (Copy from source to target)
  if (tool === "clone") {
    if (!isCloning) {
      // First click: remember where to copy from
      source.x = x;
      source.y = y;
      isCloning = true;
      alert("Now click where you want to paste the copied part.");
    } else {
      // Second click: paste the copied part at new location
      let copied = ctx.getImageData(source.x, source.y, boxSize, boxSize);
      ctx.putImageData(copied, x, y);
      isCloning = false;
    }
  }

  // 2. Blur Tool 
  else if (tool === "blur") {
    let imageData = ctx.getImageData(x, y, boxSize, boxSize);
    let data = imageData.data;

    // Loop through pixels and average RGB
    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
      // Alpha (data[i + 3]) remains unchanged
    }

    ctx.putImageData(imageData, x, y);
  }

  // 3. Spot Remover (Paint over area with white color)
  else if (tool === "spot") {
    let imageData = ctx.getImageData(x, y, boxSize, boxSize);
    let data = imageData.data;

    // Set each pixel to white (255,255,255)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // Red
      data[i + 1] = 255; // Green
      data[i + 2] = 255; // Blue
      // Alpha (data[i + 3]) remains unchanged
    }

    ctx.putImageData(imageData, x, y);
  }
});