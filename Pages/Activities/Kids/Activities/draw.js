const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

let drawing = false;
let colorPicker = document.getElementById("colorPicker");
let brushSize = document.getElementById("brushSize");

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
    if (!drawing) return;

    ctx.fillStyle = colorPicker.value;
    ctx.beginPath();
    ctx.arc(e.offsetX, e.offsetY, brushSize.value, 0, Math.PI * 2);
    ctx.fill();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveImage() {
    const link = document.createElement("a");
    link.download = "my-monster.png";
    link.href = canvas.toDataURL();
    link.click();
}
