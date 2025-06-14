const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const frogMarginBottom = 20;
const frogAspectRatio = 30 / 22; // ≈1.36

// Заглушки
const frogImg = new Image();
frogImg.src = "static/img/frog.png";
const leafImg = new Image();
leafImg.src = "static/img/leaf.png"; // путь в Flask-проекте

const flyImg = new Image();
flyImg.src = "static/img/fly.png";

const dangerImg = new Image();
dangerImg.src = "static/img/danger.png";
const frog = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 80,
    height: 80,
    moveTo(x) {
        this.x = x - this.width / 2;
    },
    draw() {
        ctx.drawImage(frogImg, this.x, this.y, this.width, this.height);
    }
};
const leaves = [];

const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

let isGameOver = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Задаём ширину и высоту с сохранением пропорций
    frog.width = canvas.width * 0.1; // Например, 10% от ширины экрана
    frog.height = frog.width / frogAspectRatio;

    // Позиционируем по центру и прижимаем вниз с отступом
    frog.x = (canvas.width - frog.width) / 2;
    frog.y = canvas.height - frog.height - frogMarginBottom;
}

function spawnLeaf() {
    const size = canvas.width * (0.1 + Math.random() * 0.3); // 2–5% ширины
    leaves.push({
        x: Math.random() * (canvas.width - size),
        y: -size, // начинаем снизу
        width: size,
        height: size,
        speed: 0.5 + Math.random(), // медленное движение вверх
        opacity: 0.4 + Math.random() * 0.4
    });
}


window.addEventListener("resize", resizeCanvas);
resizeCanvas();


window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Переменные
let score = 0;
let lives = 3;



const objects = [];
const OBJECT_TYPES = {
    FLY: "fly",
    DANGER: "danger",
    LEAVES: "leaves"
};

function spawnObject() {
    const type = Math.random() < 0.3 ? OBJECT_TYPES.FLY : OBJECT_TYPES.DANGER;
    const size = canvas.width * 0.07; // адаптивный размер
    objects.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: canvas.height * 0.005 + Math.random() * 2,
        type: type
    });
}

function drawObject(obj) {
    const img = obj.type === OBJECT_TYPES.FLY ? flyImg : dangerImg;
    ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
}

function checkCollision(obj) {
    return (
        obj.x < frog.x + frog.width &&
        obj.x + obj.width > frog.x &&
        obj.y < frog.y + frog.height &&
        obj.y + obj.height > frog.y
    );
}

function updateGame() {
    if (isGameOver) return; // ничего не делаем, если игра завершена

    ctx.clearRect(0, 0, canvas.width, canvas.height);
// Листья
    for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];
        leaf.y += leaf.speed;

        ctx.save();
        ctx.globalAlpha = leaf.opacity;
        ctx.drawImage(leafImg, leaf.x, leaf.y, leaf.width, leaf.height);
        ctx.restore();

        if (leaf.y + leaf.height < 0) {
            leaves.splice(i, 1); // удаляем ушедшие вверх
        }
    }

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        obj.y += obj.speed;
        drawObject(obj);

        if (checkCollision(obj)) {
            if (obj.type === OBJECT_TYPES.FLY) {
                score++;
                if (score >= 10) {
                    showEndMessage("Лягушонок накормлен!🎉🐸");
                    return;
                }
            } else {
                lives--;
                if (lives <= 0) {
                    showEndMessage("Игра окончена 🐸");
                    return;
                }
            }
            objects.splice(i, 1);
        } else if (obj.y > canvas.height) {
            objects.splice(i, 1);
        }
    }

    frog.draw();

    ctx.fillStyle = "black";
    ctx.font = `${canvas.width * 0.04}px Courier`;
    ctx.fillText(`Очки: ${score}`, 10, 30);
    ctx.fillText(`Жизни: ${lives}`, 10, 60);
}

function showEndMessage(text) {
    isGameOver = true;
    message.textContent = text;
    overlay.style.display = "flex";
}
restartBtn.addEventListener("click", () => {
    resetGame();
    overlay.style.display = "none";
    isGameOver = false;
});

function gameLoop() {
    updateGame();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("touchmove", function (e) {
    const touch = e.touches[0];
    frog.moveTo(touch.clientX);
});

// Спавн объектов
setInterval(spawnObject, 800);
setInterval(spawnLeaf, 1000); // каждые 1 сек

function resetGame() {
    score = 0;
    lives = 3;
    objects.length = 0;
    frog.x = (canvas.width - frog.width) / 2;
}


gameLoop();
