const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

const gridSize = 10;
const cellSize = canvas.width / gridSize;

let grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;

document.getElementById("highScore").innerText = highScore;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            ctx.strokeStyle = "#333";
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (grid[y][x]) {
                ctx.fillStyle = "#4CAF50";
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
}

function placeRandomBlock() {
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);
    if (!grid[y][x]) {
        grid[y][x] = 1;
        score += 10;
        document.getElementById("score").innerText = score;
    } else {
        gameOver();
    }
    drawGrid();
}

function gameOver() {
    document.getElementById("gameOverScreen").classList.remove("hidden");
    if (score > highScore) {
        localStorage.setItem("highScore", score);
    }
}

function restartGame() {
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    score = 0;
    document.getElementById("score").innerText = score;
    document.getElementById("gameOverScreen").classList.add("hidden");
    drawGrid();
}

canvas.addEventListener("click", placeRandomBlock);

drawGrid();
