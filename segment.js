const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;

document.getElementById('upload').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage = new Image();
        originalImage.onload = function() {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.drawImage(originalImage, 0, 0);
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('basic-segmentation').addEventListener('click', function() {
    if (!originalImage) return alert('Please upload an image first');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    grayscale(imageData.data);
    detectEdgesInPlace(imageData);
    ctx.putImageData(imageData, 0, 0);
});

function grayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
}

function detectEdgesInPlace(imageData) {
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            const left = ((y * width) + (x - 1)) * 4;
            const right = ((y * width) + (x + 1)) * 4;
            const top = (((y - 1) * width) + x) * 4;
            const bottom = (((y + 1) * width) + x) * 4;

            const gx = data[left] - data[right];
            const gy = data[top] - data[bottom];
            const gradient = Math.abs(gx) + Math.abs(gy);

            const edge = gradient > 50 ? 255 : 0;

            data[i] = data[i + 1] = data[i + 2] = edge;
            
        }
    }
}