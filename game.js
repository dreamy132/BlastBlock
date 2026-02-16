const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const blockContainer = document.getElementById("block-container");

let gridSize = 8;
let grid = [];
let cellSize = 0;

let score = 0;
let highScore = localStorage.getItem("highScore") || 0;

let dragEl = null;
let activeShape = null;
let undoGrid = null;

const COLORS = ["#38bdf8","#f472b6","#34d399","#facc15","#a78bfa"];
const SHAPES = [
    [[1]],                  // dot
    [[1,1]],                // line horizontal
    [[1],[1]],              // line vertical
    [[1,1,1]],              // line3 horizontal
    [[1],[1],[1]],          // line3 vertical
    [[1,1],[1,1]],          // square
    [[1,0],[1,0],[1,1]],    // L shape
    [[1,1,1],[0,1,0]]       // T shape
];

// -------------------
// Initialization
// -------------------
function init(){
    cellSize = Math.min(canvas.width / gridSize, canvas.height / gridSize);
    grid = Array(gridSize).fill().map(()=>Array(gridSize).fill(null));
    score = 0;
    document.getElementById("score").innerText = score;
    document.getElementById("highScore").innerText = highScore;
    drawGrid();
    refillDock();
}
window.addEventListener("resize", ()=>{init();});

// -------------------
// Grid Drawing
// -------------------
function drawGrid(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    cellSize = Math.min(canvas.width/gridSize, canvas.height/gridSize);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<gridSize;y++){
        for(let x=0;x<gridSize;x++){
            ctx.strokeStyle = "#333";
            ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
            if(grid[y][x]){
                ctx.fillStyle = grid[y][x];
                ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
        }
    }
}

// -------------------
// Dock / Shapes
// -------------------
function refillDock(){
    blockContainer.innerHTML = '';
    for(let i=0;i<3;i++){
        let shape = JSON.parse(JSON.stringify(SHAPES[Math.floor(Math.random()*SHAPES.length)]));
        let color = COLORS[Math.floor(Math.random()*COLORS.length)];
        createShape({map:shape,color});
    }
}

function createShape(shape){
    const el = document.createElement("div");
    el.className = "block";
    el.style.background = shape.color;
    el.dataset.map = JSON.stringify(shape.map);
    el.dataset.color = shape.color;
    el.addEventListener("pointerdown", e=>startDrag(e, el, shape));
    blockContainer.appendChild(el);
}

// -------------------
// Drag & Drop
// -------------------
function startDrag(e, el, shape){
    e.preventDefault();
    dragEl = el.cloneNode(true);
    dragEl.classList.add("dragging");
    document.body.appendChild(dragEl);
    activeShape = shape;
    el.classList.add("hidden");
    moveDrag(e);
    document.addEventListener("pointermove", moveDrag);
    document.addEventListener("pointerup", ev=>stopDrag(ev, el), {once:true});
}

function moveDrag(e){
    if(!dragEl) return;
    dragEl.style.left = e.clientX - dragEl.offsetWidth/2 + "px";
    dragEl.style.top = e.clientY - dragEl.offsetHeight/2 + "px";
}

function stopDrag(e, original){
    document.removeEventListener("pointermove", moveDrag);
    let pos = getGridPos(e);
    if(pos && canPlace(pos.r,pos.c,activeShape)){
        undoGrid = JSON.parse(JSON.stringify(grid));
        placeShape(pos.r,pos.c,activeShape);
        original.remove();
        if(blockContainer.children.length===0) refillDock();
        checkLines();
    } else {
        original.classList.remove("hidden");
    }
    if(dragEl){ dragEl.remove(); dragEl = null; }
}

// -------------------
// Grid Helpers
// -------------------
function getGridPos(e){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if(r>=0 && r<gridSize && c>=0 && c<gridSize) return {r,c};
    return null;
}

function canPlace(r,c,shape){
    for(let i=0;i<shape.map.length;i++){
        for(let j=0;j<shape.map[0].length;j++){
            if(shape.map[i][j]){
                if(r+i>=gridSize || c+j>=gridSize || grid[r+i][c+j]) return false;
            }
        }
    }
    return true;
}

function placeShape(r,c,shape){
    for(let i=0;i<shape.map.length;i++){
        for(let j=0;j<shape.map[0].length;j++){
            if(shape.map[i][j]){
                grid[r+i][c+j] = shape.color;
            }
        }
    }
    drawGrid();
}

// -------------------
// Check Lines & Score
// -------------------
function checkLines(){
    let cleared = 0;
    for(let i=0;i<gridSize;i++){
        if(grid[i].every(v=>v)){ grid[i].fill(null); cleared++; }
        if(grid.every(row=>row[i])){ grid.forEach(r=>r[i]=null); cleared++; }
    }

    if(cleared){
        score += cleared*100;
        document.getElementById("score").innerText = score;
        if(score>highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore);
            document.getElementById("highScore").innerText = highScore;
        }
    }

    drawGrid();
    checkGameOver();
}

// -------------------
// Game Over
// -------------------
function checkGameOver(){
    for(let block of blockContainer.children){
        let shape = {map: JSON.parse(block.dataset.map)};
        for(let r=0;r<gridSize;r++){
            for(let c=0;c<gridSize;c++){
                if(canPlace(r,c,shape)) return;
            }
        }
    }
    document.getElementById("gameOverScreen").classList.remove("hidden");
}

// -------------------
// Restart
// -------------------
function restartGame(){
    grid = Array(gridSize).fill().map(()=>Array(gridSize).fill(null));
    score = 0;
    document.getElementById("score").innerText = score;
    document.getElementById("gameOverScreen").classList.add("hidden");
    refillDock();
    drawGrid();
}

// -------------------
// Start Game
// -------------------
init();
