const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

// Viewport State
let cameraX = 0;
let cameraY = 0;
let zoom = 1;

// Application State
let isDrawing = false;
let isPanning = false;
let lines = []; // Stores all drawn strokes
let currentStroke = null;

// Ensure canvas fills the screen
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}
window.addEventListener('resize', resize);
resize(); // Initial call

// Prevent context menu on right click to allow panning
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Coordinate Transformation Helpers
function screenToWorld(x, y) {
    return {
        x: (x - cameraX) / zoom,
        y: (y - cameraY) / zoom
    };
}

function worldToScreen(x, y) {
    return {
        x: x * zoom + cameraX,
        y: y * zoom + cameraY
    };
}

// Mouse Events
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { // Left click: Draw
        isDrawing = true;
        const worldPos = screenToWorld(e.clientX, e.clientY);
        currentStroke = {
            color: colorPicker.value,
            size: brushSize.value,
            points: [worldPos]
        };
        lines.push(currentStroke);
    } else if (e.button === 2 || e.button === 1) { // Right or Middle click: Pan
        isPanning = true;
        canvas.style.cursor = 'grab';
    }
});

canvas.addEventListener('mousemove', e => {
    if (isDrawing && currentStroke) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        currentStroke.points.push(worldPos);
        draw(); // Redraw with new point
    } else if (isPanning) {
        cameraX += e.movementX;
        cameraY += e.movementY;
        draw(); // Redraw shifted world
    }
});

window.addEventListener('mouseup', e => {
    if (e.button === 0) {
        isDrawing = false;
        currentStroke = null;
    } else if (e.button === 2 || e.button === 1) {
        isPanning = false;
        canvas.style.cursor = 'crosshair';
    }
});

// Zoom Logic
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    
    // Get mouse position in world space before zooming
    const mouseWorldBefore = screenToWorld(e.clientX, e.clientY);
    
    // Adjust zoom level
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        zoom *= zoomFactor; // Zoom in
    } else {
        zoom /= zoomFactor; // Zoom out
    }
    
    // Clamp zoom limits
    zoom = Math.max(0.1, Math.min(zoom, 10));
    
    // Reposition camera so the point under the mouse stays fixed
    cameraX = e.clientX - mouseWorldBefore.x * zoom;
    cameraY = e.clientY - mouseWorldBefore.y * zoom;
    
    draw();
}, { passive: false });

// Clear Action
clearBtn.addEventListener('click', () => {
    lines = [];
    draw();
});

// Main Render Loop
function draw() {
    // Clear the physical screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();

    // Render all strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (const stroke of lines) {
        if (stroke.points.length === 0) continue;
        
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        // Scale stroke width by zoom so lines get thicker when you zoom in
        ctx.lineWidth = stroke.size * zoom; 
        
        const startScreen = worldToScreen(stroke.points[0].x, stroke.points[0].y);
        ctx.moveTo(startScreen.x, startScreen.y);
        
        for (let i = 1; i < stroke.points.length; i++) {
            const screenPos = worldToScreen(stroke.points[i].x, stroke.points[i].y);
            ctx.lineTo(screenPos.x, screenPos.y);
        }
        ctx.stroke();
    }
}

// Background Grid Generator
function drawGrid() {
    const gridSize = 50 * zoom;
    // Calculate starting offsets based on camera position
    const offsetX = cameraX % gridSize;
    const offsetY = cameraY % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = '#2a2a2a'; // Subtle dark grid lines
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();
}
