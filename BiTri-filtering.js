// Get references to canvases, buttons, and file input
const originalCanvas = document.getElementById('original-canvas');
const resultCanvas   = document.getElementById('result-canvas');
const imageUpload    = document.getElementById('image-upload');
const btnBilinear    = document.getElementById('btn-bilinear');
const btnTrilinear   = document.getElementById('btn-trilinear');
const btnClear       = document.getElementById('btn-clear');
const btnDownload    = document.getElementById('btn-download');

// Get 2D rendering contexts for drawing operations
const originalCtx = originalCanvas.getContext('2d');
const resultCtx   = resultCanvas.getContext('2d');

// Globals for the image and point arrays
let image = new Image();        // Will hold the uploaded image
let srcPts = [], dstPts = [];   // Arrays of {x,y} for source & destination points

// For trilinear filtering, we pre-build a half-res mipmap
let mipmapData, mipW, mipH;

// --- Build half-resolution mipmap ---
// Draws the original image at half size onto an offscreen canvas
// and extracts its pixel data for later use in trilinear blending
function buildMipmap() {
  // Compute half dimensions, at least 1px
  mipW = Math.max(1, Math.floor(originalCanvas.width / 2));
  mipH = Math.max(1, Math.floor(originalCanvas.height / 2));
  // Create offscreen canvas and draw scaled image
  const off = document.createElement('canvas');
  off.width = mipW;
  off.height = mipH;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(image, 0, 0, mipW, mipH);
  // Capture pixel buffer
  mipmapData = offCtx.getImageData(0, 0, mipW, mipH).data;
}

// --- Image Load Handler ---
// When user selects a file, read it and set as image.src
imageUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;  // no file, do nothing

  const reader = new FileReader();
  reader.onload = evt => { image.src = evt.target.result; };
  reader.readAsDataURL(file);
});

// Once image.src updates, this onload triggers
image.onload = () => {
  // Resize canvases to match image dimensions
  originalCanvas.width  = image.width;
  originalCanvas.height = image.height;
  resultCanvas.width    = image.width;
  resultCanvas.height   = image.height;

  // Draw the uploaded image onto the original canvas
  originalCtx.drawImage(image, 0, 0);
  // Clear any previous result
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

  // Reset picked points
  srcPts = [];
  dstPts = [];
  // Build the mipmap for trilinear
  buildMipmap();
};

// --- Point Picking & Marker Drawing ---
// Draws a colored circle marker at (x,y) on the given context
function drawMarker(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// On original canvas: pick source points up to 3
originalCanvas.addEventListener('click', e => {
  if (srcPts.length >= 3) return;
  const rect = originalCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  srcPts.push({ x, y });
  drawMarker(originalCtx, x, y, 'red');  // red marker
});

// On result canvas: pick destination points up to 3
resultCanvas.addEventListener('click', e => {
  if (dstPts.length >= 3) return;
  const rect = resultCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dstPts.push({ x, y });
  drawMarker(resultCtx, x, y, 'blue'); // blue marker
});

// Clear points and redraw original image & clear result
btnClear.addEventListener('click', () => {
  originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  originalCtx.drawImage(image, 0, 0);
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  srcPts = [];
  dstPts = [];
});

// Download the processed result as PNG
btnDownload.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = resultCanvas.toDataURL('image/png');
  link.download = 'filtered-image.png';
  link.click();
});

// --- Math Helper Functions ---
// Compute the area of triangle ABC
function triArea(A, B, C) {
  return Math.abs((B.x - A.x)*(C.y - A.y) - (C.x - A.x)*(B.y - A.y)) * 0.5;
}

// Convert pt into barycentric coords relative to triangle ABC
function barycentric(pt, A, B, C) {
  const det = (B.y - C.y)*(A.x - C.x) + (C.x - B.x)*(A.y - C.y);
  const l1 = ((B.y - C.y)*(pt.x - C.x) + (C.x - B.x)*(pt.y - C.y)) / det;
  const l2 = ((C.y - A.y)*(pt.x - C.x) + (A.x - C.x)*(pt.y - C.y)) / det;
  return [l1, l2, 1 - l1 - l2];
}

// Check if barycentric coords indicate pt is inside triangle
function inTriangle(bc) {
  return bc[0] >= 0 && bc[1] >= 0 && bc[2] >= 0;
}

// Bilinear interpolation on pixel array 'pixels' with dimensions w×h
function bilinearInterpolate(x, y, pixels, w, h) {
  const x1 = Math.floor(x), y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, w - 1), y2 = Math.min(y1 + 1, h - 1);
  const dx = x - x1, dy = y - y1;
  const i11 = (y1 * w + x1) * 4;
  const i21 = (y1 * w + x2) * 4;
  const i12 = (y2 * w + x1) * 4;
  const i22 = (y2 * w + x2) * 4;
  let c = [0,0,0,0];
  for (let i = 0; i < 4; i++) {
    const r1 = pixels[i11 + i] * (1 - dx) + pixels[i21 + i] * dx;
    const r2 = pixels[i12 + i] * (1 - dx) + pixels[i22 + i] * dx;
    c[i] = r1 * (1 - dy) + r2 * dy;
  }
  return c;
}

// --- Core Warp & Filter Function ---
// method: 'bilinear' for enlarge or 'trilinear' for shrink
function doWarp(method) {
  // Ensure exactly 3 src & 3 dst points
  if (srcPts.length !== 3 || dstPts.length !== 3) {
    return alert('Pick 3 source and 3 destination points first.');
  }

  const W = originalCanvas.width, H = originalCanvas.height;
  resultCtx.clearRect(0, 0, W, H);
  const imgData = resultCtx.createImageData(W, H);
  const dst = imgData.data;
  const src = originalCtx.getImageData(0, 0, W, H).data;

  // Compute scale factor via triangle area ratio
  const sA = triArea(srcPts[0], srcPts[1], srcPts[2]);
  const dA = triArea(dstPts[0], dstPts[1], dstPts[2]);
  const scale = Math.sqrt(dA / sA);
  // Blend weight for trilinear (only >0 when shrinking)
  const w    = Math.max(0, Math.min(1, 2 * (1 - scale)));

  // Loop over each pixel in result
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Get barycentric coords in destination triangle
      const bc = barycentric({ x, y }, dstPts[0], dstPts[1], dstPts[2]);
      if (!inTriangle(bc)) continue;
      // Map back to source image
      const sx = bc[0]*srcPts[0].x + bc[1]*srcPts[1].x + bc[2]*srcPts[2].x;
      const sy = bc[0]*srcPts[0].y + bc[1]*srcPts[1].y + bc[2]*srcPts[2].y;

      let col;
      if (method === 'bilinear' || scale >= 1) {
        // Enlarge or same size: simple bilinear
        col = bilinearInterpolate(sx, sy, src, W, H);
      } else {
        // Shrink: trilinear blend of full-res + half-res
        const c1 = bilinearInterpolate(sx,    sy,    src,        W,   H);
        const c2 = bilinearInterpolate(sx/2,  sy/2,  mipmapData, mipW, mipH);
        col = c1.map((v,i) => v*(1 - w) + c2[i]*w);
      }

      // Write RGBA into output buffer
      const idx = 4 * (y * W + x);
      dst[idx]     = col[0];
      dst[idx + 1] = col[1];
      dst[idx + 2] = col[2];
      dst[idx + 3] = col[3];
    }
  }

  // Draw the final image data onto the result canvas
  resultCtx.putImageData(imgData, 0, 0);
}

// --- Wire Up Buttons ---
btnBilinear.addEventListener('click',  () => doWarp('bilinear'));
btnTrilinear.addEventListener('click', () => doWarp('trilinear'));
