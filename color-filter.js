const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('real-file');
const img = new Image();
img.src='your-image.jpg';


// Function to apply color filters to image data
function applyColorFilter(imageData, type) {
    const data = imageData.data; // Extract pixel data from the image
  
    // Grayscale filter
    if (type === "grayscale") {
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
  
        const average = (red + green + blue) / 3;
  
        data[i] = average;       // Red
        data[i + 1] = average;   // Green
        data[i + 2] = average;   // Blue
        // Alpha (data[i + 3]) remains unchanged
      }
    }
  
    // Sepia filter
    else if (type === "sepia") {
      // Coefficients for red output
      const redFactorR = 0.393;
      const redFactorG = 0.769;
      const redFactorB = 0.189;
  
      // Coefficients for green output
      const greenFactorR = 0.349;
      const greenFactorG = 0.686;
      const greenFactorB = 0.168;
  
      // Coefficients for blue output
      const blueFactorR = 0.272;
      const blueFactorG = 0.534;
      const blueFactorB = 0.131;
  
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

    
  
        const newRed = redFactorR * red + redFactorG * green + redFactorB * blue;
        const newGreen = greenFactorR * red + greenFactorG * green + greenFactorB * blue;
        const newBlue = blueFactorR * red + blueFactorG * green + blueFactorB * blue;
  
        data[i] = newRed;
        data[i + 1] = newGreen;
        data[i + 2] = newBlue;
    
      }
    }
  
    return imageData; // Return the modified image data
  }