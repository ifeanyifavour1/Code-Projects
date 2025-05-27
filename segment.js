// Get HTML elements by ID
const imageInput    = document.getElementById('imageInput');
const segmentBtn    = document.getElementById('segmentBtn');
const thresholdInput= document.getElementById('thresholdInput');
const downloadBtn   = document.getElementById('downloadBtn');
const canvas        = document.getElementById('canvas');
const ctx           = canvas.getContext('2d');
let img = new Image();

// Load the selected image and draw it on the canvas
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  img = new Image();
  img.onload = () => {
    canvas.width  = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0); // draw image to canvas
  };
  img.src = URL.createObjectURL(file); // create image URL from file
});

segmentBtn.addEventListener('click', () => {
  // 1. Read raw input (string) and trim whitespace
  const rawInput = thresholdInput.value.trim();

  // 2. Decide on threshold:
  //    - if user typed nothing → default (200)
  //    - else try to parse and validate
  let threshold = 200;  // default
  if (rawInput !== '') {
    const num = Number(rawInput);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      threshold = num;
    } else {
      // invalid number → notify and keep default
      alert('Threshold must be between 0 and 255. Using default 200.');
    }
  }

  // Redraw the original image to clear any prior edits
  ctx.drawImage(img, 0, 0);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Binarize and highlight
  binarize(imageData, threshold);
  ctx.putImageData(imageData, 0, 0);
  highlightShapes(imageData);
});

// Converts image to black & white based on threshold
function binarize(imageData, threshold) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray  = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = gray > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

// Finds connected white regions, draws a red box around each
function highlightShapes(imageData) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const boxes = [];

  function idx(x, y) { return y * width + x; }
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x,y);
      if (visited[i] || data[i*4] === 0) continue;

      // BFS queue
      const queue = [[x,y]];
      visited[i] = 1;

      let left=x, right=x, top=y, bottom=y, area=0;
      while (queue.length) {
        const [cx, cy] = queue.shift();
        area++;
        left   = Math.min(left,   cx);
        right  = Math.max(right,  cx);
        top    = Math.min(top,    cy);
        bottom = Math.max(bottom, cy);

        for (const [dx, dy] of dirs) {
          const nx = cx+dx, ny = cy+dy;
          if (nx>=0 && nx<width && ny>=0 && ny<height) {
            const ni = idx(nx,ny);
            if (!visited[ni] && data[ni*4] === 255) {
              visited[ni] = 1;
              queue.push([nx,ny]);
            }
          }
        }
      }

      // Only draw boxes around reasonably large areas
      if (area > 100) {
        boxes.push({ x: left, y: top, width: right-left+1, height: bottom-top+1 });
      }
    }
  }

  ctx.strokeStyle = 'red';
  ctx.lineWidth   = 2;
  boxes.forEach(b => ctx.strokeRect(b.x, b.y, b.width, b.height));
}

// Download canvas as PNG when button clicked
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'segmented-image.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
});
