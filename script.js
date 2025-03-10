document.addEventListener('DOMContentLoaded', () => {
    const cameraElement = document.getElementById('camera');
    const canvasElement = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const resetBtn = document.getElementById('reset-btn');
    const combineBtn = document.getElementById('combine-btn');
    const downloadBtn = document.getElementById('download-btn');
    const guideText = document.querySelector('.guide-text');
    const finalImage = document.getElementById('final-image');
    
    let currentImageIndex = 0;
    const maxImages = 4;
    const capturedImages = [];
    let stream = null;
    
    const positions = [
        "Position 1: Top Left",
        "Position 2: Top Right",
        "Position 3: Bottom Left",
        "Position 4: Bottom Right"
    ];
    
    // Start camera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Use back camera if available
                audio: false
            });
            cameraElement.srcObject = stream;
            cameraElement.play();
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Error accessing camera. Please make sure you've granted camera permissions.");
        }
    }
    
    // Initialize the app
    function init() {
        startCamera();
        updateUI();
    }
    
    // Update UI based on current state
    function updateUI() {
        // Update guidance text
        guideText.textContent = positions[currentImageIndex];
        
        // Update indicators
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            if (index < currentImageIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // Enable/disable combine button
        combineBtn.disabled = currentImageIndex < maxImages;
    }
    
    // Capture image
    function captureImage() {
        if (currentImageIndex >= maxImages) {
            return;
        }
        
        const context = canvasElement.getContext('2d');
        
        // Set canvas dimensions to match video
        canvasElement.width = cameraElement.videoWidth;
        canvasElement.height = cameraElement.videoHeight;
        
        // Draw the current frame from the video
        context.drawImage(cameraElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Get the image data as a data URL
        const imageData = canvasElement.toDataURL('image/png');
        capturedImages[currentImageIndex] = imageData;
        
        // Display in preview
        const previewBox = document.getElementById(`preview-${currentImageIndex + 1}`);
        previewBox.style.backgroundImage = `url(${imageData})`;
        
        // Move to next image
        currentImageIndex++;
        
        // Update UI
        updateUI();
    }
    
    // Combine images into a single composition
    function combineImages() {
        const resultCanvas = document.createElement('canvas');
        const ctx = resultCanvas.getContext('2d');
        
        // Set canvas size for 2x2 grid
        const imgWidth = canvasElement.width;
        const imgHeight = canvasElement.height;
        resultCanvas.width = imgWidth * 2;
        resultCanvas.height = imgHeight * 2;
        
        // Load all images
        const images = capturedImages.map(src => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = src;
            });
        });
        
        // When all images are loaded, draw them to the canvas
        Promise.all(images).then(loadedImages => {
            // Draw images in a 2x2 grid
            ctx.drawImage(loadedImages[0], 0, 0, imgWidth, imgHeight);                  // Top left
            ctx.drawImage(loadedImages[1], imgWidth, 0, imgWidth, imgHeight);           // Top right
            ctx.drawImage(loadedImages[2], 0, imgHeight, imgWidth, imgHeight);          // Bottom left
            ctx.drawImage(loadedImages[3], imgWidth, imgHeight, imgWidth, imgHeight);   // Bottom right
            
            // Display the final image
            finalImage.style.backgroundImage = `url(${resultCanvas.toDataURL('image/png')})`;
            downloadBtn.style.display = 'inline-block';
            
            // Save for download
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = 'composed-image.png';
                link.href = resultCanvas.toDataURL('image/png');
                link.click();
            };
        });
    }
    
    // Reset the app
    function resetApp() {
        currentImageIndex = 0;
        capturedImages.length = 0;
        
        // Clear preview boxes
        document.querySelectorAll('.preview-box').forEach(box => {
            box.style.backgroundImage = 'none';
        });
        
        // Clear final image
        finalImage.style.backgroundImage = 'none';
        downloadBtn.style.display = 'none';
        
        // Update UI
        updateUI();
    }
    
    // Event listeners
    captureBtn.addEventListener('click', captureImage);
    resetBtn.addEventListener('click', resetApp);
    combineBtn.addEventListener('click', combineImages);
    
    // Initialize
    init();
});
