const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

let drawing = false;

// Function to resize canvas for high-quality drawing
function resizeCanvas() {
    const container = canvas.parentElement;
    // We set internal pixels higher than CSS size for sharpness
    canvas.width = container.clientWidth - 20; 
    canvas.height = Math.min(window.innerHeight * 0.6, 500); 
    
    // Reset brush settings after resize as resizing clears context
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Helper to get coordinates for both Mouse and Touch
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrawing(e) {
    drawing = true;
    const coords = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    e.preventDefault();
}

function stopDrawing() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;
    
    const coords = getCoords(e);
    
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    e.preventDefault();
}

// Mouse Listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("mousemove", draw);

// Touch Listeners (Mobile)
canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchend", stopDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveImage() {
    const link = document.createElement("a");
    link.download = "my-monster.png";
    link.href = canvas.toDataURL();
    link.click();
}