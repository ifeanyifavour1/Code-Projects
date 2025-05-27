// --- Grab HTML Elements ---
// These are the buttons, file input, and canvases from the page.
const originalCanvas = document.getElementById('original-canvas');
const resultCanvas   = document.getElementById('result-canvas');
const imageUpload    = document.getElementById('image-upload');
const btnBilinear    = document.getElementById('btn-bilinear');
const btnTrilinear   = document.getElementById('btn-trilinear');
const btnClear       = document.getElementById('btn-clear');
const btnDownload    = document.getElementById('btn-download');

// Get the 2D drawing contexts for both canvases
const originalCtx = originalCanvas.getContext('2d');
const resultCtx   = resultCanvas.getContext('2d');

// This will hold our uploaded image
let image = new Image();

// Arrays to store the 3 source points (on the original image)
// and 3 destination points (on the result canvas)
let srcPts = [], dstPts = [];

// --- Load Image Into Canvases ---
// When the user selects a file, read it and draw it in the original canvas
imageUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;  // nothing to do if no file

  const reader = new FileReader();
  reader.onload = evt => image.src = evt.target.result;
  reader.readAsDataURL(file);
});

// Once the image is loaded, resize both canvases to match,
// draw it on the original canvas, and clear any previous result
image.onload = () => {
  originalCanvas.width  = image.width;
  originalCanvas.height = image.height;
  resultCanvas.width    = image.width;
  resultCanvas.height   = image.height;

  originalCtx.drawImage(image, 0, 0);
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

  // Reset point arrays in case user reloads a new image
  srcPts = [];
  dstPts = [];
};

// --- Point Picking & Marking ---
// Draw a small colored circle at (x,y) to show picked points
function drawMarker(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// On the original canvas, let user click to pick up to 3 source points
originalCanvas.addEventListener('click', e => {
  if (srcPts.length >= 3) return; // only 3 points allowed
  const rect = originalCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  srcPts.push({ x, y });
  drawMarker(originalCtx, x, y, 'red');  // red dot = source
});

// On the result canvas, let user click to pick up to 3 destination points
resultCanvas.addEventListener('click', e => {
  if (dstPts.length >= 3) return; // only 3 points allowed
  const rect = resultCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dstPts.push({ x, y });
  drawMarker(resultCtx, x, y, 'blue'); // blue dot = destination
});

// --- Math Helper Functions ---

// Compute the area of triangle ABC (needed to get scale)
function triArea(A, B, C) {
  // Cross-product formula for area, absolute value, times 0.5
  return Math.abs((B.x - A.x)*(C.y - A.y) - (C.x - A.x)*(B.y - A.y)) * 0.5;
}

// Convert a point to barycentric coordinates relative to triangle ABC
function barycentric(pt, A, B, C) {
  const det = (B.y - C.y)*(A.x - C.x) + (C.x - B.x)*(A.y - C.y);
  const l1 = ((B.y - C.y)*(pt.x - C.x) + (C.x - B.x)*(pt.y - C.y)) / det;
  const l2 = ((C.y - A.y)*(pt.x - C.x) + (A.x - C.x)*(pt.y - C.y)) / det;
  // Third coordinate ensures l1+l2+l3 = 1
  return [l1, l2, 1 - l1 - l2];
}

// Check if barycentric coords indicate the point is inside the triangle
function inTriangle(bc) {
  return bc[0] >= 0 && bc[1] >= 0 && bc[2] >= 0;
}

// Perform bilinear interpolation to get a smooth color value
function bilinearInterpolate(x, y, pixels, w, h) {
  // Floor down to get top-left corner, then bottom-right
  const x1 = Math.floor(x), y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, w - 1), y2 = Math.min(y1 + 1, h - 1);
  const dx = x - x1, dy = y - y1;

  // Compute 1D indices into the pixel array (4 bytes per pixel)
  const i11 = (y1 * w + x1) * 4;
  const i21 = (y1 * w + x2) * 4;
  const i12 = (y2 * w + x1) * 4;
  const i22 = (y2 * w + x2) * 4;

  // Interpolate each RGBA channel
  let c = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    // Interpolate horizontally, then vertically
    const r1 = pixels[i11 + i] * (1 - dx) + pixels[i21 + i] * dx;
    const r2 = pixels[i12 + i] * (1 - dx) + pixels[i22 + i] * dx;
    c[i] = r1 * (1 - dy) + r2 * dy;
  }
  return c;
}

// Clear all markers and redraw the original image
function clearMarkers() {
  originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  originalCtx.drawImage(image, 0, 0);
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  srcPts = [];
  dstPts = [];
}

// --- Core Warp & Filter Function ---
// `method` is either 'bilinear' or 'trilinear'
function doWarp(method) {
  // Ensure user picked exactly 3 points in each canvas
  if (srcPts.length !== 3 || dstPts.length !== 3) {
    return alert('Please pick 3 source points and 3 destination points.');
  }

  const srcW = originalCanvas.width, srcH = originalCanvas.height;
  // Create a blank image buffer for the result
  const imgData = resultCtx.createImageData(srcW, srcH);
  const dst = imgData.data;
  // Get pixel data of the original image
  const src = originalCtx.getImageData(0, 0, srcW, srcH).data;

  // Compute scale factor from the ratio of triangle areas
  const sArea = triArea(srcPts[0], srcPts[1], srcPts[2]);
  const dArea = triArea(dstPts[0], dstPts[1], dstPts[2]);
  const scale = Math.sqrt(dArea / sArea);
  // w parameter blends between two resolutions when shrinking
  const w = Math.max(0, Math.min(1, 2 * (1 - scale)));

  // For every pixel in the result
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      // Convert (x,y) to barycentric coords in the destination triangle
      const bc = barycentric({ x, y }, dstPts[0], dstPts[1], dstPts[2]);
      if (!inTriangle(bc)) continue; // skip pixels outside the tri

      // Map back to source image using those barycentric weights
      const sx = bc[0] * srcPts[0].x + bc[1] * srcPts[1].x + bc[2] * srcPts[2].x;
      const sy = bc[0] * srcPts[0].y + bc[1] * srcPts[1].y + bc[2] * srcPts[2].y;

      let col;
      if (method === 'bilinear' || scale >= 1) {
        // enlarge or same size: just bilinear
        col = bilinearInterpolate(sx, sy, src, srcW, srcH);
      } else {
        // shrinking: blend original and half-res for trilinear
        const c1 = bilinearInterpolate(sx, sy, src, srcW, srcH);
        const c2 = bilinearInterpolate(sx * 0.5, sy * 0.5, src, srcW, srcH);
        col = c1.map((v, i) => v * (1 - w) + c2[i] * w);
      }

      // Write the RGBA values back into the result buffer
      const idx = (y * srcW + x) * 4;
      dst[idx]     = col[0];
      dst[idx + 1] = col[1];
      dst[idx + 2] = col[2];
      dst[idx + 3] = col[3];
    }
  }

  // Paint the processed image back onto the result canvas
  resultCtx.putImageData(imgData, 0, 0);
}

// --- Wire Up Buttons ---
// Each button now calls doWarp with the correct method
btnBilinear.addEventListener('click',  () => doWarp('bilinear'));
btnTrilinear.addEventListener('click', () => doWarp('trilinear'));
btnClear.addEventListener('click',      clearMarkers);
btnDownload.addEventListener('click', () => {
  // Convert canvas to PNG data URL and trigger download
  const link = document.createElement('a');
  link.href = resultCanvas.toDataURL('image/png');
  link.download = 'filtered-image.png';
  link.click();
});
