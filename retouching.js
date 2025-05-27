// imageEditingTools.js
// Complete JS for clone, improved natural blur, and spot-removal with comments

// --- Element References ---
const canvas      = document.getElementById("canvas");           // Main canvas element
const ctx         = canvas.getContext("2d");                   // 2D drawing context
const uploadInput = document.getElementById("upload");          // File input for uploading images
const toolSelect  = document.getElementById("tool-select");     // Dropdown to select tool (clone, blur, spot)
const radiusInput = document.getElementById("radius-input");    // Input for spot-remover radius
const downloadBtn = document.getElementById("download-btn");    // Button to download edited image

// --- State Variables ---
let tool      = toolSelect.value;  // Current tool mode
let isCloning = false;             // Flag to track clone source selection
let source    = { x: 0, y: 0 };    // Coordinates of clone source point
const boxSize = 20;                // Size (pixels) of selection box for clone/blur

// --- Image Upload Handler ---
uploadInput.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return; // No file selected

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Resize canvas to match image dimensions
      canvas.width  = img.width;
      canvas.height = img.height;
      // Draw the uploaded image onto the canvas
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result; // Set image source to file data URL
  };
  reader.readAsDataURL(file);
});

// --- Tool Selection Handler ---
// Show or hide radius input based on whether 'spot' tool is selected
toolSelect.addEventListener("change", function() {
  tool = toolSelect.value;
  radiusInput.style.display = (tool === "spot") ? "inline-block" : "none";
});
// Initialize radius input visibility on page load
radiusInput.style.display = (tool === "spot") ? "inline-block" : "none";

// --- Spot Remover Function ---
// Samples a radius-based area, averages colors, and paints a smaller patch
function applySpotRemover(x, y) {
  // 1) Read and validate radius from input, default to 5 if invalid
  let r = parseInt(radiusInput.value);
  if (isNaN(r) || r < 1) r = 5;

  // 2) Sample a (2r+1)x(2r+1) block centered at (x,y)
  const sampleSize = 2 * r + 1;
  const sx = Math.max(0, x - r);
  const sy = Math.max(0, y - r);
  const imageData = ctx.getImageData(sx, sy, sampleSize, sampleSize);
  const data = imageData.data;

  // 3) Compute average RGB and A values
  let rSum=0, gSum=0, bSum=0, aSum=0, count=0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];       // Red channel
    gSum += data[i + 1];   // Green channel
    bSum += data[i + 2];   // Blue channel
    aSum += data[i + 3];   // Alpha channel
    count++;
  }
  const avgR = rSum / count;
  const avgG = gSum / count;
  const avgB = bSum / count;
  const avgA = aSum / count;

  // 4) Write average color back into a smaller target area (half size)
  const targetSize = Math.floor(sampleSize / 2);
  const off = Math.floor(targetSize / 2);
  const targetData = ctx.getImageData(x - off, y - off, targetSize, targetSize);
  const tData = targetData.data;
  for (let i = 0; i < tData.length; i += 4) {
    tData[i]     = avgR;
    tData[i + 1] = avgG;
    tData[i + 2] = avgB;
    tData[i + 3] = avgA;
  }
  // Paint the averaged patch back onto canvas
  ctx.putImageData(targetData, x - off, y - off);
}

// --- Mouse Down Handler: Clone, Blur, or Spot ---
canvas.addEventListener("mousedown", function(e) {
  const x = e.offsetX;
  const y = e.offsetY;

  if (tool === "clone") {
    // Clone tool: first click sets source, second click pastes image block
    if (!isCloning) {
      source = { x, y };
      isCloning = true;
      alert("Clone source set at (" + x + "," + y + "). Click destination to paste.");
    } else {
      // Copy a boxSize x boxSize block from source and draw at destination
      const copied = ctx.getImageData(source.x, source.y, boxSize, boxSize);
      ctx.putImageData(copied, x - Math.floor(boxSize/2), y - Math.floor(boxSize/2));
      isCloning = false;
    }
  }
  else if (tool === "blur") {
    // Improved Blur tool: natural box blur with 3x3 kernel
    const half = Math.floor(boxSize / 2);
    // Determine sample region centered on click, clamped to canvas bounds
    const sx = Math.max(0, x - half);
    const sy = Math.max(0, y - half);
    const w  = Math.min(boxSize, canvas.width  - sx);
    const h  = Math.min(boxSize, canvas.height - sy);

    // Extract the image data for the region
    const imageData = ctx.getImageData(sx, sy, w, h);
    const data      = imageData.data;
    // Make a copy for neighborhood sampling
    const orig      = new Uint8ClampedArray(data);

    // Box blur radius = 1 => 3x3 neighborhood
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        let rSum=0, gSum=0, bSum=0, aSum=0, cnt=0;
        // Sum over 3x3 window
        for (let dy=-1; dy<=1; dy++) {
          for (let dx=-1; dx<=1; dx++) {
            const yy = row + dy;
            const xx = col + dx;
            // Skip out-of-bounds
            if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
            const idx = 4 * (yy * w + xx);
            rSum += orig[idx];
            gSum += orig[idx + 1];
            bSum += orig[idx + 2];
            aSum += orig[idx + 3];
            cnt++;
          }
        }
        // Compute averages and write back
        const dstIdx = 4 * (row * w + col);
        data[dstIdx]     = rSum / cnt;
        data[dstIdx + 1] = gSum / cnt;
        data[dstIdx + 2] = bSum / cnt;
        data[dstIdx + 3] = aSum / cnt;
      }
    }
    // Paint blurred region back onto canvas
    ctx.putImageData(imageData, sx, sy);
  }
  else if (tool === "spot") {
    // Spot remover: remove blemish at click location
    applySpotRemover(x, y);
  }
});

// --- Download Edited Image ---
downloadBtn.addEventListener("click", function() {
  const link = document.createElement('a');
  link.download = "retouched-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
