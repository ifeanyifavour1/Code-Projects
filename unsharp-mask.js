const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const input = document.getElementById("real-file");
const applyBtn = document.getElementById("applyBtn");
const ratioInput = document.getElementById("ratio");

let originalImage = null;

// Handle image upload
input.addEventListener("change", function(e) {
  let file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    originalImage = new Image();
    originalImage.onload = function() {
      // Resize canvas to match image dimensions
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      ctx.drawImage(originalImage, 0, 0);
    };
    originalImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Apply unsharp masking
applyBtn.addEventListener("click", function() {
  if (!originalImage) {
    alert("Please upload an image first!");
    return;
  }

  // Get ratio value (default to 1.5 if invalid)
  let ratio = ratioInput.value;
  if (!ratio || isNaN(ratio)) {
    ratio = 1.5;
  } else {
    ratio = +ratio; // Convert string to number using unary plus
  }

  // Create a blurred version of the image
  const blurredCanvas = document.createElement("canvas");
  const blurredCtx = blurredCanvas.getContext("2d");
  blurredCanvas.width = canvas.width;
  blurredCanvas.height = canvas.height;

  // Apply blur using the ratio as blur radius
  blurredCtx.filter = "blur(" + ratio + "px)";
  blurredCtx.drawImage(canvas, 0, 0);

  // Get image data from original and blurred versions
  const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blurredData = blurredCtx.getImageData(0, 0, canvas.width, canvas.height);

  // Amount controls the strength of the sharpening effect
  const amount = 1.5;

  // Helper function to keep pixel values between 0-255
  function clamp(value) {
    return value < 0 ? 0 : value > 255 ? 255 : value;
  }

  // Apply unsharp masking formula to each pixel
  for (let i = 0; i < originalData.data.length; i += 4) {
    // For each RGB channel 
    originalData.data[i] = clamp(originalData.data[i] + amount * (originalData.data[i] - blurredData.data[i]));
    originalData.data[i + 1] = clamp(originalData.data[i + 1] + amount * (originalData.data[i + 1] - blurredData.data[i + 1]));
    originalData.data[i + 2] = clamp(originalData.data[i + 2] + amount * (originalData.data[i + 2] - blurredData.data[i + 2]));
  }

  // Put the processed image data back on the canvas
  ctx.putImageData(originalData, 0, 0);
});