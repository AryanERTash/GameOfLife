

const CONFIG = {
	// some config/constants
	ROWS: 32,
	COLS: 62,
	FRAME_INTERVAL_MS: 90,
	CELL_CLASS: {
		LIVING: 'living',
		DEAD: 'dead'
	},
	BOARD_SELECTOR: '.board',
	ROW_SELECTOR: '.row',
	CELL_SELECTOR: '.cell',
	MSG_ID: 'msg',
	DENSITY: 0.41 // 0 to 1 density
};


let gameGrid = [];   /*
						This grid only mainatain a narrow view of structure, if a structure goes out of view then it may never return
						and can cause structures to misbehave
						We can use another technique for infinite plane(like storing only live cell 
																coordinates or using bigger grid and showing some portion/view of grid)
					*/
let gamePaused = true;
let isMouseDown = false;
let didDrag = false;
let mouseButton = 0;


window.addEventListener('keyup', (evt) => {
	if (evt.key === ' ') {
		togglePause();
	}
});


document.addEventListener('DOMContentLoaded', () => {
	initGame();
});


function initGame() {
	initModelGrid();
	initDummyGrid();
	initBoardView();
	updateBoardView();
	addCellEventListeners();
	setInterval(nextGameFrame, CONFIG.FRAME_INTERVAL_MS);

}

function nextGameFrame() {

	if (gamePaused) return;

	const tempGrid = [];

	for (let i = 0; i < CONFIG.ROWS; i++) {
		tempGrid[i] = [];
		for (let j = 0; j < CONFIG.COLS; j++) {
			const state = gameGrid[i][j];
			const liveNeighbors = countLiveNeighbors(i, j);

			// Game of Life rules
			if (state && liveNeighbors < 2) {
				tempGrid[i][j] = false; // Underpopulation
			} else if (state && (liveNeighbors === 2 || liveNeighbors === 3)) {
				tempGrid[i][j] = true; // Survival
			} else if (state && liveNeighbors > 3) {
				tempGrid[i][j] = false; // Overpopulation
			} else if (!state && liveNeighbors === 3) {
				tempGrid[i][j] = true; // Reproduction
			} else {
				tempGrid[i][j] = false;
			}
		}
	}

	gameGrid = tempGrid;
	updateBoardView();
}

function countLiveNeighbors(row, col) {
	// how many live neighbour does a cell have
	let count = 0;

	for (let di = -1; di <= 1; di++) {
		for (let dj = -1; dj <= 1; dj++) {

			if (di === 0 && dj === 0) continue;

			const ni = row + di, nj = col + dj;

			if (ni >= 0 && ni < CONFIG.ROWS && nj >= 0 && nj < CONFIG.COLS && gameGrid[ni][nj]) {
				count++;
			}
		}
	}
	return count;
}


function togglePause() {
	const msg = document.getElementById(CONFIG.MSG_ID);
	if (gamePaused) {
		msg.style.display = 'none';
	} else {
		msg.style.display = 'block';
	}
	gamePaused = !gamePaused;
}

function toogleCellStateOnClick(evt) {

	if (!gamePaused) return;
	const cell = evt.target;

	const i = Number(cell.dataset.row);
	const j = Number(cell.dataset.col);

	cell.classList.remove(getCellStatus(i, j));


	gameGrid[i][j] = !gameGrid[i][j];
	cell.classList.add(getCellStatus(i, j));

}

function addCellEventListeners() {

	const rows = document.querySelectorAll(CONFIG.ROW_SELECTOR);

	for (let i = 0; i < CONFIG.ROWS; i++) {
		const row = rows[i];
		const cells = row.querySelectorAll(CONFIG.CELL_SELECTOR);

		for (let j = 0; j < CONFIG.COLS; j++) {
			const cell = cells[j];
			cell.addEventListener('mousedown', (evt) => {
				if (!gamePaused) return;
				isMouseDown = true;
				didDrag = false;
				mouseButton = evt.button;
				if (mouseButton === 2) evt.preventDefault();
			});
			cell.addEventListener('mouseover', (evt) => {
				if (!gamePaused) return;
				if (isMouseDown) {
					if (mouseButton === 0) {
						setCellAlive(evt.target);
					} else if (mouseButton === 2) {
						setCellDead(evt.target);
					}
					didDrag = true;
				}
			});
			cell.addEventListener('click', (evt) => {
				if (!gamePaused) return;
				if (didDrag) return;
				toogleCellStateOnClick(evt);
			});
			cell.addEventListener('contextmenu', (evt) => {
				if (!gamePaused) return;
				evt.preventDefault();
			});
		}
	}

	document.addEventListener('mouseup', () => {
		isMouseDown = false;
	});
	window.addEventListener('mouseup', () => {
		isMouseDown = false;
	});
	window.addEventListener('pointerup', () => {
		isMouseDown = false;
	});
	window.addEventListener('mouseleave', () => {
		isMouseDown = false;
	});

	const board = document.querySelector(CONFIG.BOARD_SELECTOR);
	board.addEventListener('mouseleave', () => {
		isMouseDown = false;
	});
}

function setCellAlive(cell) {
	const i = Number(cell.dataset.row);
	const j = Number(cell.dataset.col);
	if (!gameGrid[i][j]) {
		cell.classList.remove(CONFIG.CELL_CLASS.DEAD);
		cell.classList.add(CONFIG.CELL_CLASS.LIVING);
		gameGrid[i][j] = true;
	}
}

function setCellDead(cell) {
	const i = Number(cell.dataset.row);
	const j = Number(cell.dataset.col);
	if (gameGrid[i][j]) {
		cell.classList.remove(CONFIG.CELL_CLASS.LIVING);
		cell.classList.add(CONFIG.CELL_CLASS.DEAD);
		gameGrid[i][j] = false;
	}
}

function initBoardView() {
	const board = document.querySelector(CONFIG.BOARD_SELECTOR);
	for (let i = 0; i < CONFIG.ROWS; i++) {

		const row = document.createElement('div');
		row.classList.add('row');
		for (let j = 0; j < CONFIG.COLS; j++) {

			const cell = document.createElement('div');
			cell.classList.add('cell', CONFIG.CELL_CLASS.DEAD);
			cell.dataset.row = i;
			cell.dataset.col = j;
			row.appendChild(cell);

		}
		board.appendChild(row);
	}
}

function getCellStatus(i, j) {
	return gameGrid[i][j] ? CONFIG.CELL_CLASS.LIVING : CONFIG.CELL_CLASS.DEAD;
}

function updateBoardView() {
	const rows = document.querySelectorAll(CONFIG.ROW_SELECTOR);
	for (let i = 0; i < CONFIG.ROWS; i++) {

		const row = rows[i];


		const cells = row.querySelectorAll(CONFIG.CELL_SELECTOR);



		for (let j = 0; j < CONFIG.COLS; j++) {
			const cell = cells[j];
			const status = getCellStatus(i, j);
			cell.classList.remove(CONFIG.CELL_CLASS.LIVING, CONFIG.CELL_CLASS.DEAD);
			cell.classList.add(status);
		}
	}
}


function initModelGrid() {
	gameGrid = [];

	for (let i = 0; i < CONFIG.ROWS; i++) {

		gameGrid[i] = [];
		for (let j = 0; j < CONFIG.COLS; j++) {
			gameGrid[i][j] = false;
		}
	}
}

function initDummyGrid() {


	for (let i = 0; i < CONFIG.ROWS; i++) {
		for (let j = 0; j < CONFIG.COLS; j++) {
			gameGrid[i][j] = Math.random() <= CONFIG.DENSITY;
		}
	}
}
