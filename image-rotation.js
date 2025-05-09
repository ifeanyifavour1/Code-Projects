const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('real-file');
const rotateBtn = document.getElementById('rotate-btn');
const angleInput = document.getElementById('angle-input');

let image = new Image();
let rotationAngle = 0;

// Handle image upload
input.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        image.src = e.target.result;

        image.onload = function () {
            canvas.width = image.width;
            canvas.height = image.height;
            drawImageRotated();
        };
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// Function to draw the image with the current rotation
function drawImageRotated() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Move to center
    ctx.rotate(rotationAngle * Math.PI / 180); // Rotate in radians
    ctx.drawImage(image, -image.width / 2, -image.height / 2); // Draw from center
    ctx.restore();
}

// Handle button click to rotate
rotateBtn.addEventListener('click', () => {
    const angle = parseInt(angleInput.value) || 0;
    rotationAngle += angle;  // Increase rotation
    drawImageRotated();  // Redraw image
});