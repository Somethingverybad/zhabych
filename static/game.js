const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const frogMarginBottom = 120;
const frogAspectRatio = 0.32; // ≈1.36

// Заглушки
const frogImg = new Image();
frogImg.src = "static/img/frog.png";

const gif = new Image();
gif.src = "static/img/success.gif";
const leafImg = new Image();
leafImg.src = "static/img/leaf.png";

const flyImg = new Image();
flyImg.src = "static/img/fly.png";

const dangerImg = new Image();
dangerImg.src = "static/img/danger.png";

const frog = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    moveTo(x) {
        this.x = x - this.width / 2;
    },
    draw() {
        ctx.drawImage(frogImg, this.x, this.y, this.width, this.height);
    }
};

const leaves = [];
const objects = [];
const OBJECT_TYPES = {
    FLY: "fly",
    DANGER: "danger",
    LEAVES: "leaves"
};

let bigRock = false;
let isGameOver = false;
let score = 0;
let lives = 5;
let playerName = "Гость";
let isGameRunning = true;
let gameSpeed = 1.0;
let difficultyIncreaseInterval;
let highScores = [];

const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const submessage = document.getElementById("submessage");
const restartBtn = document.getElementById("restartBtn");

// Используем относительный путь для API
const API_URL = "/api";

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    frog.width = canvas.width * 0.13;
    frog.height = frog.width / frogAspectRatio;

    frog.x = (canvas.width - frog.width) / 2;
    frog.y = canvas.height - frog.height - frogMarginBottom;
}

function spawnLeaf() {
    const size = canvas.width * (0.1 + Math.random() * 0.3);
    leaves.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 0.5 + Math.random(),
        opacity: 0.4 + Math.random() * 0.4
    });
}

function bigRockSpawning() {
    if (bigRock) return;
    const type = OBJECT_TYPES.DANGER;
    const size = canvas.width * 0.5;
    objects.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size * 1.5,
        speed: canvas.height * 0.005 + Math.random() * 0.05,
        type: type
    });
}

function spawnObject() {
    if (!isGameRunning) return;
    
    const type = Math.random() < 0.5 ? OBJECT_TYPES.FLY : OBJECT_TYPES.DANGER;
    if (Math.random() < 0.1) {
        bigRockSpawning();
        return;
    }
    
    if (type == OBJECT_TYPES.DANGER) {
        const size = canvas.width * 0.2;
        objects.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size * 1.5,
            speed: canvas.height * 0.005 * gameSpeed + Math.random(),
            type: type
        });
    } else {
        const size = canvas.width * 0.1;
        objects.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: canvas.height * 0.005 * gameSpeed + Math.random() * 5,
            type: type
        });
    }
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

function showEndMessage(text) {
    isGameOver = true;
    isGameRunning = false;
    message.textContent = text;
    overlay.style.display = "flex";

    if (text.includes("накормлена")) {
        submessage.innerHTML = `
            <p></p>
            <img src="static/img/success1.gif" alt="Success" style="max-width: 80%; margin-top: 20px;" />
        `;
    } else {
        submessage.innerHTML = "";
    }
    
    if (text.includes("окончена")) {
        const saveScoreBtn = document.createElement("button");
        saveScoreBtn.id = "saveScoreBtn";
        saveScoreBtn.textContent = "Сохранить результат";
        saveScoreBtn.addEventListener("click", saveScore);
        
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "playerName";
        nameInput.placeholder = "Ваше имя";
        nameInput.value = playerName;
        
        submessage.innerHTML = "";
        submessage.appendChild(document.createElement("br"));
        submessage.appendChild(nameInput);
        submessage.appendChild(document.createElement("br"));
        submessage.appendChild(saveScoreBtn);
        
        loadHighScores();
    }
}

async function saveScore() {
    playerName = document.getElementById("playerName").value || "Гость";
    
    try {
        const response = await fetch(`${API_URL}/scores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: playerName,
                score: score
            }),
        });
        
        if (response.ok) {
            alert("Результат сохранен!");
            loadHighScores();
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.error || "Неизвестная ошибка"}`);
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось сохранить результат");
    }
}

async function loadHighScores() {
    try {
        const response = await fetch(`${API_URL}/scores`);
        if (response.ok) {
            highScores = await response.json();
            displayHighScores();
        } else {
            console.error("Ошибка при загрузке рекордов");
        }
    } catch (error) {
        console.error("Ошибка при загрузке рекордов:", error);
    }
}

function displayHighScores() {
    const scoresContainer = document.createElement("div");
    scoresContainer.id = "highScores";
    scoresContainer.innerHTML = "<h3>Лучшие результаты:</h3>";
    
    if (highScores.length === 0) {
        scoresContainer.innerHTML += "<p>Пока нет результатов</p>";
    } else {
        const ol = document.createElement("ol");
        highScores.slice(0, 10).forEach(score => {
            const li = document.createElement("li");
            li.textContent = `${score.name}: ${score.score}`;
            ol.appendChild(li);
        });
        scoresContainer.appendChild(ol);
    }
    
    const existingScores = document.getElementById("highScores");
    if (existingScores) {
        existingScores.remove();
    }
    
    submessage.appendChild(scoresContainer);
}

function resetGame() {
    score = 0;
    lives = 5;
    objects.length = 0;
    gameSpeed = 1.0;
    frog.x = (canvas.width - frog.width) / 2;
    isGameRunning = true;
    isGameOver = false;
    
    if (difficultyIncreaseInterval) {
        clearInterval(difficultyIncreaseInterval);
    }
    
    difficultyIncreaseInterval = setInterval(() => {
        gameSpeed *= 1.5;
    }, 10000);
}

function updateGame() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        obj.y += obj.speed;
        drawObject(obj);

        if (checkCollision(obj)) {
            if (obj.type === OBJECT_TYPES.FLY) {
                score++;
            } else {
                lives--;
                if (lives <= 0) {
                    showEndMessage("Игра окончена 💔");
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
    ctx.font = `${canvas.width * 0.04}px Arial`;
    ctx.textBaseline = "top";
    ctx.fillText(`🍰 ${score}`, 10, 10);
    const frogEmoji = '❤️'.repeat(lives);
    const textWidth = ctx.measureText(frogEmoji).width;
    ctx.fillText(frogEmoji, canvas.width - textWidth - 10, 10);
}

function gameLoop() {
    updateGame();
    requestAnimationFrame(gameLoop);
}

// Обработчики событий
canvas.addEventListener("touchmove", function (e) {
    const touch = e.touches[0];
    frog.moveTo(touch.clientX);
});

canvas.addEventListener("mousemove", function (e) {
    frog.moveTo(e.clientX);
});

restartBtn.addEventListener("click", () => {
    resetGame();
    overlay.style.display = "none";
    submessage.innerHTML = "";
});

// Инициализация игры
window.addEventListener("load", () => {
    resizeCanvas();
    loadHighScores();
});

window.addEventListener("resize", resizeCanvas);

// Запуск игры
setInterval(spawnObject, 1000);
gameLoop();