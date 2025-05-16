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
    const grayData = grayscale(imageData.data);
    const edges = detectEdges(grayData, canvas.width, canvas.height);
    ctx.putImageData(new ImageData(edges, canvas.width, canvas.height), 0, 0);
});

function grayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return data;
}

function detectEdges(data, width, height) {
    const edgeData = new Uint8ClampedArray(data.length);
    
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            const gx = data[i - 4] - data[i + 4];  // Horizontal gradient (Sobel filter)
            const gy = data[i - width * 4] - data[i + width * 4];  // Vertical gradient (Sobel filte)
            const gradient = Math.abs(gx) + Math.abs(gy);
            const edgeValue = gradient > 50 ? 255 : 0;  
            edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edgeValue;  // Set color to white for edges, black for others
            edgeData[i + 3] = 255;  
        }
    }
    
    return edgeData;
}