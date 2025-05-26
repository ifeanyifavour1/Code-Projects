const imageInput = document.getElementById('imageInput');
const segmentBtn = document.getElementById('segmentBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();

// Load the image into the canvas when selected
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };
  img.src = URL.createObjectURL(file);
});

// On button click, binarize + highlight shapes
segmentBtn.addEventListener('click', () => {
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  binarize(imageData);
  ctx.putImageData(imageData, 0, 0);
  highlightShapes(imageData);
});

// Convert to black/white, dark shapes → white pixels
function binarize(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i+1] + data[i+2]) / 3;
    // Dark shapes become white (255), background black (0)
    const value = gray < 200 ? 255 : 0;
    data[i] = data[i+1] = data[i+2] = value;
  }
}

// BFS-based flood-fill to find connected white blobs
function highlightShapes(imageData) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const boxes = [];

  function idx(x, y) {
    return y * width + x;
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i*4] === 0) continue;

      // --- BFS starts here ---
      const queue = [[x, y]];
      visited[i] = 1;
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;

      while (queue.length) {
        const [cx, cy] = queue.shift();  // FIFO → BFS
        area++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        for (const [dx, dy] of dirs) {
          const nx = cx + dx, ny = cy + dy;
          if (
            nx >= 0 && nx < width &&
            ny >= 0 && ny < height
          ) {
            const ni = idx(nx, ny);
            if (!visited[ni] && data[ni*4] === 255) {
              visited[ni] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
      // --- BFS ends here ---

      // ignore tiny noise blobs
      if (area > 100) {
        boxes.push({
          x: minX,
          y: minY,
          w: maxX - minX + 1,
          h: maxY - minY + 1
        });
      }
    }
  }

  // Draw red bounding boxes
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  for (const b of boxes) {
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
}
