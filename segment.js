const imageInput = document.getElementById('imageInput');
const segmentBtn = document.getElementById('segmentBtn');
const thresholdInput = document.getElementById('thresholdInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();

// Load the image when selected
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

segmentBtn.addEventListener('click', () => {
  // Get user input threshold, fallback to 200 if invalid
  let threshold = Number(thresholdInput.value);
  if (isNaN(threshold) || threshold < 0 || threshold > 255) {
    threshold = 200;
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  binarize(imageData, threshold);
  ctx.putImageData(imageData, 0, 0);
  highlightShapes(imageData);
});

function binarize(imageData, threshold) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = gray > threshold ? 255 : 0; // Updated logic using threshold
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

function highlightShapes(imageData) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const boundingBoxes = [];

  function getIndex(x, y) {
    return y * width + x;
  }

  const directions = [
    [1, 0], // right
    [-1, 0], // left
    [0, 1], // down
    [0, -1], // up
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = getIndex(x, y);
      if (visited[pixelIndex] || data[pixelIndex * 4] === 0) continue;

      const queue = [[x, y]];
      visited[pixelIndex] = 1;

      let leftMostX = x;
      let rightMostX = x;
      let topMostY = y;
      let bottomMostY = y;
      let area = 0;

      while (queue.length > 0) {
        const [currentX, currentY] = queue.shift();
        area++;

        if (currentX < leftMostX) leftMostX = currentX;
        if (currentX > rightMostX) rightMostX = currentX;
        if (currentY < topMostY) topMostY = currentY;
        if (currentY > bottomMostY) bottomMostY = currentY;

        for (const [dx, dy] of directions) {
          const neighborX = currentX + dx;
          const neighborY = currentY + dy;

          if (
            neighborX >= 0 &&
            neighborX < width &&
            neighborY >= 0 &&
            neighborY < height
          ) {
            const neighborIndex = getIndex(neighborX, neighborY);
            if (!visited[neighborIndex] && data[neighborIndex * 4] === 255) {
              visited[neighborIndex] = 1;
              queue.push([neighborX, neighborY]);
            }
          }
        }
      }

      if (area > 100) {
        boundingBoxes.push({
          x: leftMostX,
          y: topMostY,
          width: rightMostX - leftMostX + 1,
          height: bottomMostY - topMostY + 1,
        });
      }
    }
  }

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  for (const box of boundingBoxes) {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
  onst downloadBtn = document.getElementById('downloadBtn');

downloadBtn.addEventListener('click', () => {
  
  const link = document.createElement('a');
  link.download = 'segmented-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
}
