const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const toggleBtn = document.getElementById('toggleSpline');

let points = [];
let useSpline = false;

canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  points.push({ x, y });
  draw();
});

toggleBtn.addEventListener('click', () => {
  useSpline = !useSpline;
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (points.length < 2) return;

  if (useSpline && points.length > 2) {
    drawSpline(points);
  } else {
    drawBrokenLine(points);
  }
}

function drawBrokenLine(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#0077cc';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Catmull-Rom spline implementation
function drawSpline(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  // tension = 0.5 for Catmull-Rom
  const tension = 0.5;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    // for each segment, interpolate 20 points
    for (let t = 0.02; t <= 1; t += 0.02) {
      const tt = t * t;
      const ttt = tt * t;

      const x = 0.5 * ((-p0.x + 3*p1.x - 3*p2.x + p3.x) * ttt
                   + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * tt
                   + (-p0.x + p2.x) * t
                   + 2*p1.x);

      const y = 0.5 * ((-p0.y + 3*p1.y - 3*p2.y + p3.y) * ttt
                   + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * tt
                   + (-p0.y + p2.y) * t
                   + 2*p1.y);

      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = '#d62828';
  ctx.lineWidth = 2;
  ctx.stroke();
}