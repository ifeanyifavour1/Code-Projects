const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('real-file');
const rotateBtn = document.getElementById('rotate-btn');
const angleInput = document.getElementById('angle-input');
const downloadBtn = document.getElementById('download-btn');

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'rotated-image.png'; // filename
    link.href = canvas.toDataURL('image/png'); // image data
    link.click();
});



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

function drawImageRotated() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotationAngle * Math.PI / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
}

// Handle button click to rotate
rotateBtn.addEventListener('click', () => {
    const angle = parseInt(angleInput.value) || 0;
    rotationAngle += angle;
    drawImageRotated();
});