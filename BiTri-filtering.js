// --- Grab elements ---
const originalCanvas = document.getElementById('original-canvas');
const resultCanvas   = document.getElementById('result-canvas');
const imageUpload    = document.getElementById('image-upload');
const filterMethod   = document.getElementById('filter-method');
const btnApplyFilter = document.getElementById('btn-apply-filter');
const btnClear       = document.getElementById('btn-clear');
const btnDownload    = document.getElementById('btn-download');

const originalCtx = originalCanvas.getContext('2d');
const resultCtx   = resultCanvas.getContext('2d');
let image = new Image();

// Arrays to hold the 3 picked points
let srcPts = [], dstPts = [];

// --- Load image ---
imageUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => image.src = evt.target.result;
  reader.readAsDataURL(file);
});

image.onload = () => {
  originalCanvas.width  = image.width;
  originalCanvas.height = image.height;
  resultCanvas.width    = image.width;
  resultCanvas.height   = image.height;
  originalCtx.drawImage(image, 0, 0);
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  srcPts = [];
  dstPts = [];
};

// --- Point picking ---
function drawMarker(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

originalCanvas.addEventListener('click', e => {
  if (srcPts.length >= 3) return;
  const r = originalCanvas.getBoundingClientRect();
  srcPts.push({ x: e.clientX - r.left, y: e.clientY - r.top });
  drawMarker(originalCtx, srcPts.at(-1).x, srcPts.at(-1).y, 'red');
});

resultCanvas.addEventListener('click', e => {
  if (dstPts.length >= 3) return;
  const r = resultCanvas.getBoundingClientRect();
  dstPts.push({ x: e.clientX - r.left, y: e.clientY - r.top });
  drawMarker(resultCtx, dstPts.at(-1).x, dstPts.at(-1).y, 'blue');
});

// --- Helpers ---
function triArea(A, B, C) {
  return Math.abs(
    (B.x - A.x)*(C.y - A.y) -
    (C.x - A.x)*(B.y - A.y)
  ) * 0.5;
}

function barycentric(pt, A, B, C) {
  const det = (B.y - C.y)*(A.x - C.x) + (C.x - B.x)*(A.y - C.y);
  const l1 = ((B.y - C.y)*(pt.x - C.x) + (C.x - B.x)*(pt.y - C.y)) / det;
  const l2 = ((C.y - A.y)*(pt.x - C.x) + (A.x - C.x)*(pt.y - C.y)) / det;
  return [l1, l2, 1 - l1 - l2];
}

function inTriangle(bc) {
  return bc[0] >= 0 && bc[1] >= 0 && bc[2] >= 0;
}

function bilinearInterpolate(x, y, pixels, w, h) {
  const x1 = Math.floor(x), y1 = Math.floor(y);
  const x2 = Math.min(x1+1, w-1), y2 = Math.min(y1+1, h-1);
  const dx = x - x1, dy = y - y1;
  const i11 = (y1*w + x1)*4, i21 = (y1*w + x2)*4;
  const i12 = (y2*w + x1)*4, i22 = (y2*w + x2)*4;
  let c=[0,0,0,0];
  for(let i=0;i<4;i++){
    const r1 = pixels[i11+i]*(1-dx) + pixels[i21+i]*dx;
    const r2 = pixels[i12+i]*(1-dx) + pixels[i22+i]*dx;
    c[i]=r1*(1-dy)+r2*dy;
  }
  return c;
}

function clearMarkers() {
  originalCtx.clearRect(0,0,originalCanvas.width,originalCanvas.height);
  originalCtx.drawImage(image, 0, 0);
  resultCtx.clearRect(0,0,resultCanvas.width,resultCanvas.height);
  srcPts = [];
  dstPts = [];
}

// --- Warp + filter ---
function doWarp() {
  if (srcPts.length!==3 || dstPts.length!==3)
    return alert('Pick 3 source and 3 destination points first!');

  const method = filterMethod.value;
  const srcW = originalCanvas.width, srcH = originalCanvas.height;
  const imgData = resultCtx.createImageData(srcW, srcH);
  const dst = imgData.data;
  const src = originalCtx.getImageData(0,0,srcW,srcH).data;

  const sArea = triArea(srcPts[0],srcPts[1],srcPts[2]);
  const dArea = triArea(dstPts[0],dstPts[1],dstPts[2]);
  const scale = Math.sqrt(dArea / sArea);
  const w = Math.max(0, Math.min(1, 2*(1 - scale)));

  for (let y=0; y<srcH; y++){
    for (let x=0; x<srcW; x++){
      const bc = barycentric({x,y}, dstPts[0],dstPts[1],dstPts[2]);
      if (!inTriangle(bc)) continue;

      const sx = bc[0]*srcPts[0].x + bc[1]*srcPts[1].x + bc[2]*srcPts[2].x;
      const sy = bc[0]*srcPts[0].y + bc[1]*srcPts[1].y + bc[2]*srcPts[2].y;

      let col;
      if (method === 'bilinear' || scale >= 1) {
        col = bilinearInterpolate(sx, sy, src, srcW, srcH);
      } else if (method === 'trilinear') {
        const c1 = bilinearInterpolate(sx, sy, src, srcW, srcH);
        const c2 = bilinearInterpolate(sx*0.5, sy*0.5, src, srcW, srcH);
        col = c1.map((v,i)=> v*(1-w) + c2[i]*w);
      } else {
        col = bilinearInterpolate(sx, sy, src, srcW, srcH);
      }

      const idx = (y*srcW + x)*4;
      dst[idx]   = col[0];
      dst[idx+1] = col[1];
      dst[idx+2] = col[2];
      dst[idx+3] = col[3];
    }
  }

  resultCtx.putImageData(imgData, 0, 0);
}

// --- Wire up ---
btnApplyFilter.addEventListener('click', doWarp);
btnClear.addEventListener('click', clearMarkers);
btnDownload.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = resultCanvas.toDataURL('image/png');
  link.download = 'filtered-image.png';
  link.click();
});
