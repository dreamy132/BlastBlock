// === Canvas & Grid ===
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const blockContainer = document.getElementById("block-container");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");

let gridSize = 8;
let grid = [];
let cellSize = 0;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let dragEl = null;
let activeShape = null;
let theme = 'dark'; // default
document.body.classList.add('theme-dark');

const COLORS = ["#38bdf8","#f472b6","#34d399","#facc15","#a78bfa"];
const SHAPES = [
    [[1]],[[1,1]],[[1],[1]],[[1,1,1]],[[1],[1],[1]],[[1,1],[1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[0,1,0]]
];

// === Initialize ===
function init(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight*0.6;
    cellSize = Math.min(canvas.width/gridSize, canvas.height/gridSize);
    grid = Array(gridSize).fill().map(()=>Array(gridSize).fill(null));
    score = 0;
    scoreEl.innerText = score;
    highScoreEl.innerText = highScore;
    drawGrid();
    refillDock();
}
window.addEventListener("resize", init);

// === Grid Rendering ===
function drawGrid(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<gridSize;y++){
        for(let x=0;x<gridSize;x++){
            ctx.strokeStyle = "#333";
            ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
            if(grid[y][x]){
                ctx.fillStyle = grid[y][x];
                ctx.shadowColor = getComputedStyle(document.body).getPropertyValue('--block-glow');
                ctx.shadowBlur = 10;
                ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
                ctx.shadowBlur = 0;
            }
        }
    }
}

// === Dock / Shapes ===
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

// === Drag & Drop ===
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
    drawGrid();
    showPreview(e);
}

function stopDrag(e, original){
    document.removeEventListener("pointermove", moveDrag);
    let pos = getGridPos(e);
    if(pos && canPlace(pos.r,pos.c,activeShape)){
        placeShape(pos.r,pos.c,activeShape);
        original.remove();
        if(blockContainer.children.length===0) refillDock();
        checkLines(pos.r,pos.c);
    } else {
        original.classList.remove("hidden");
    }
    if(dragEl){ dragEl.remove(); dragEl = null; }
}

// === Grid Helpers ===
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
            if(shape.map[i][j]) grid[r+i][c+j] = shape.color;
        }
    }
    drawGrid();
}

// === Preview ===
function showPreview(e){
    let pos = getGridPos(e);
    if(!pos) return;
    activeShape.map.forEach((row,i)=>{
        row.forEach((cell,j)=>{
            if(cell && pos.r+i<gridSize && pos.c+j<gridSize && !grid[pos.r+i][pos.c+j]){
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect((pos.c+j)*cellSize,(pos.r+i)*cellSize,cellSize,cellSize);
            }
        });
    });
}

// === Lines & Score ===
function checkLines(r,c){
    let cleared = 0;
    for(let i=0;i<gridSize;i++){
        if(grid[i].every(v=>v)){ grid[i].fill(null); cleared++; showFloatingScore(i, 0, cleared*100);}
        if(grid.every(row=>row[i])){ grid.forEach(r=>r[i]=null); cleared++; showFloatingScore(0, i, cleared*100);}
    }
    if(cleared){
        score += cleared*100;
        scoreEl.innerText = score;
        if(score>highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore);
            highScoreEl.innerText = highScore;
        }
    }
    drawGrid();
    checkGameOver();
}

// === Floating Score Animation ===
function showFloatingScore(r,c,points){
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.style.left = c*cellSize + 'px';
    el.style.top = r*cellSize + 'px';
    el.innerText = '+'+points;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1000);
}

// === Game Over ===
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

// === Restart ===
function restartGame(){
    grid = Array(gridSize).fill().map(()=>Array(gridSize).fill(null));
    score = 0;
    scoreEl.innerText = score;
    document.getElementById("gameOverScreen").classList.add("hidden");
    refillDock();
    drawGrid();
}

// === Theme Toggle (Dark / Neon / Pastel) ===
function setTheme(t){
    theme = t;
    document.body.className = 'theme-'+t;
}
