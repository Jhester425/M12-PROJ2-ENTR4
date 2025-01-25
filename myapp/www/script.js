window.addEventListener('load', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const lifePercentage = document.getElementById('life-percentage');
    const levelElement = document.getElementById('level');
    const highscoreElement = document.getElementById('highscore');
    const pauseButton = document.getElementById('pause-btn');
    const speedSlider = document.getElementById('speed-slider');
    const lifeBarFill = document.getElementById('life-bar-fill');

    let gameInterval;
    let obstacleInterval;
    let snake = [{ x: 4, y: 4 }];
    let direction = 'RIGHT';
    let food = { x: 6, y: 6 };
    let obstacles = [];
    let speed = 3;
    let score = 0;
    let life = 100;
    let level = 1;
    let highScore = 0;
    let isPaused = false;
    let gridSize = 10;
    let currentFoodImage;

    // Función para crear el tablero de juego
    function createGameBoard(size) {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${size}, 32px)`;
        gameBoard.style.gridTemplateRows = `repeat(${size}, 32px)`;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gameBoard.appendChild(cell);
        }
    }

    // Función para dibujar el juego (snake, comida, obstáculos)
    function drawGame() {
        const cells = gameBoard.children;
        Array.from(cells).forEach(cell => {
            cell.style.backgroundImage = ''; // Limpiar todas las imágenes de las celdas
            cell.style.transform = ''; // Restablecer las transformaciones
        });

        // Dibujar la serpiente
        snake.forEach((segment, index) => {
            const cellIndex = segment.y * gridSize + segment.x;
            const imageUrl = index === 0 ? 'fotos/head.png' : 'fotos/body.png'; // Cabeza o cuerpo
            cells[cellIndex].style.backgroundImage = `url(${imageUrl})`;

            if (index === 0) {
                const rotation = {
                    'UP': 'rotate(270deg)',
                    'DOWN': 'rotate(90deg)',
                    'LEFT': 'rotate(180deg)',
                    'RIGHT': 'rotate(0deg)'
                }[direction];
                cells[cellIndex].style.transform = rotation;
            }
        });

        // Dibujar la comida
        const foodIndex = food.y * gridSize + food.x;
        cells[foodIndex].style.backgroundImage = `url(${currentFoodImage})`;

        // Dibujar obstáculos
        obstacles.forEach(obstacle => {
            const cellIndex = obstacle.y * gridSize + obstacle.x;
            const obstacleImage = `fotos/${obstacle.type}.png`;
            cells[cellIndex].style.backgroundImage = `url(${obstacleImage})`;
        });
    }

    // Función para manejar la entrada de teclas
    function handleKeyPress(event) {
        if (event.key === 'ArrowUp' && direction !== 'DOWN') {
            direction = 'UP';
        } else if (event.key === 'ArrowDown' && direction !== 'UP') {
            direction = 'DOWN';
        } else if (event.key === 'ArrowLeft' && direction !== 'RIGHT') {
            direction = 'LEFT';
        } else if (event.key === 'ArrowRight' && direction !== 'LEFT') {
            direction = 'RIGHT';
        }
    }

    // Función principal del juego que mueve la serpiente, verifica comida y colisiones
    function gameLoop() {
        if (isPaused) return;

        const head = { ...snake[0] };

        // Mover la serpiente
        if (direction === 'UP') head.y--;
        if (direction === 'DOWN') head.y++;
        if (direction === 'LEFT') head.x--;
        if (direction === 'RIGHT') head.x++;

        // Bordes del tablero (rebote)
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;

        // Colisión con el cuerpo
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            endGame();
            return;
        }

        // Colisión con obstáculos
        const obstacleHitIndex = obstacles.findIndex(obstacle => obstacle.x === head.x && obstacle.y === head.y);
        if (obstacleHitIndex !== -1) {
            life -= obstacles[obstacleHitIndex].damage;
            obstacles.splice(obstacleHitIndex, 1);
            updateLifeBar();
            if (life <= 0) {
                endGame();
                return;
            }
        }

        snake.unshift(head);

        // Comer comida
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            increaseHealth(0.2);
            levelUp();
            generateFood();
        } else {
            snake.pop(); // Eliminar cola
        }

        scoreElement.innerText = score;
        levelElement.innerText = level;
        highscoreElement.innerText = highScore;

        drawGame();
    }

    // Función para generar comida
    function generateFood() {
        do {
            food = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
            obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y));

        const foodImages = [
            'fotos/food1.png',
            'fotos/food2.png',
            'fotos/food3.png',
            'fotos/food4.png',
            'fotos/food5.png'
        ];
        currentFoodImage = foodImages[Math.floor(Math.random() * foodImages.length)];
    }

    // Función para generar obstáculos
    function generateNewObstacle() {
        const obstacleType = Math.random() < 0.75 ? 'bush' : Math.random() < 0.95 ? 'tree' : 'rock';
        let newObstacle;
        do {
            newObstacle = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize),
                type: obstacleType,
                damage: obstacleType === 'bush' ? 5 : obstacleType === 'tree' ? 10 : 20
            };
        } while (
            snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) ||
            obstacles.some(obstacle => obstacle.x === newObstacle.x && obstacle.y === newObstacle.y) ||
            (food.x === newObstacle.x && food.y === newObstacle.y)
        );

        obstacles.push(newObstacle);
    }

    // Función para aumentar la vida al comer
    function increaseHealth(amount) {
        life = Math.min(life + amount, 100);
        updateLifeBar();
    }

    // Función para actualizar la barra de vida
    function updateLifeBar() {
        const percentage = Math.max(0, Math.min(100, life));
        lifeBarFill.style.width = `${percentage}%`;
        lifePercentage.textContent = `${Math.floor(percentage)}%`;
    }

    // Función para nivelar el juego
    function levelUp() {
        if (score % 70 === 0 && score <= 420) {
            level++;
            gridSize = level + 9;
            createGameBoard(gridSize);
            drawGame();
        }
    }

    // Función para pausar o reanudar el juego
    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(gameInterval);
            clearInterval(obstacleInterval);
            pauseButton.innerText = 'Resume';
        } else {
            gameInterval = setInterval(gameLoop, 1000 / speed);
            obstacleInterval = setInterval(generateNewObstacle, 10000);
            pauseButton.innerText = 'Pause';
        }
    }

    // Función para terminar el juego
    function endGame() {
        alert(`Game Over! Final Score: ${score}`);
        if (score > highScore) {
            highScore = score;
            highscoreElement.innerText = highScore;
        }
        resetGame();
    }

    // Función para reiniciar el juego
    function resetGame() {
        snake = [{ x: 4, y: 4 }];
        score = 0;
        level = 1;
        life = 100;
        direction = 'RIGHT';
        gridSize = 10;
        obstacles = [];
        createGameBoard(gridSize);
        generateFood();
        drawGame();
        updateLifeBar();
    }

    // Asignación de eventos
    document.addEventListener('keydown', handleKeyPress);
    speedSlider.addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        if (!isPaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / speed);
        }
    });

    pauseButton.addEventListener('click', togglePause);

    // Inicializar juego
    createGameBoard(gridSize);
    generateFood();
    drawGame();
    updateLifeBar();

    // Iniciar el loop del juego
    gameInterval = setInterval(gameLoop, 1000 / speed);
    obstacleInterval = setInterval(generateNewObstacle, 10000);
});

