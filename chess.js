window.onload = function() {
    // Your JavaScript code goes here

// Select the canvas and get the context
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Define the size of a square
const SQUARE_SIZE = canvas.width / 8;


const game = new Chess();

// Variables for handling user interactions
let draggedPiece = null;
let draggedPieceX = 0;
let draggedPieceY = 0;
let possibleMoves = [];
let capturedWhitePieces = [];
let capturedBlackPieces = [];
let whiteTime = 10 * 60; // 10 minutes in seconds
let blackTime = 10 * 60;



// Get the existing canvas elements from the HTML
const capturedWhitePiecesCanvas = document.getElementById('capturedWhitePiecesCanvas');
const capturedBlackPiecesCanvas = document.getElementById('capturedBlackPiecesCanvas');

// Set the width and height of the canvases
capturedWhitePiecesCanvas.width = 60; // Adjust this value to change the size of the images
capturedWhitePiecesCanvas.height = 240; // Adjust this value to change the number of images that can be displayed at once

capturedBlackPiecesCanvas.width = 60; // Adjust this value to change the size of the images
capturedBlackPiecesCanvas.height = 240; // Adjust this value to change the number of images that can be displayed at once



let intervalId = setInterval(function() {
    const currentPlayer = game.turn();
    if (currentPlayer === 'w') {
        whiteTime--;
        if (whiteTime === 0) {
            clearInterval(intervalId);
            alert('Black wins by timeout!');
        }
    } else {
        blackTime--;
        if (blackTime === 0) {
            clearInterval(intervalId);
            alert('White wins by timeout!');
        }
    }
    updateTimerDisplay();
}, 1000);

function updateTimerDisplay() {
    const whiteMinutes = Math.floor(whiteTime / 60);
    const whiteSeconds = whiteTime % 60;
    const blackMinutes = Math.floor(blackTime / 60);
    const blackSeconds = blackTime % 60;
    document.getElementById('whiteTimer').textContent = `${whiteMinutes}:${whiteSeconds < 10 ? '0' : ''}${whiteSeconds}`;
    document.getElementById('blackTimer').textContent = `${blackMinutes}:${blackSeconds < 10 ? '0' : ''}${blackSeconds}`;
}

// Load the images
const images = {
    'b': {
        'p': new Image(),
        'r': new Image(),
        'n': new Image(),
        'b': new Image(),
        'q': new Image(),
        'k': new Image()
    },
    'w': {
        'p': new Image(),
        'r': new Image(),
        'n': new Image(),
        'b': new Image(),
        'q': new Image(),
        'k': new Image()
    }
};

images['b']['p'].src = 'Images/bp.png';
images['b']['r'].src = 'Images/br.png';
images['b']['n'].src = 'Images/bn.png';
images['b']['b'].src = 'Images/bb.png';
images['b']['q'].src = 'Images/bq.png';
images['b']['k'].src = 'Images/bk.png';

images['w']['p'].src = 'Images/wp.png';
images['w']['r'].src = 'Images/wr.png';
images['w']['n'].src = 'Images/wn.png';
images['w']['b'].src = 'Images/wb.png';
images['w']['q'].src = 'Images/wq.png';
images['w']['k'].src = 'Images/wk.png';


// Start the game loop
function gameLoop() {
    drawBoard();

    // Check if the game is over
    if (game.game_over()) {
        ctx.fillStyle = 'black';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (game.in_checkmate()) {
            const winner = game.turn() === 'w' ? 'Black' : 'White';
            ctx.fillText(winner + ' wins!', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText('Draw!', canvas.width / 2, canvas.height / 2);
        }
    } else {
        requestAnimationFrame(gameLoop);
    }

    drawCapturedPieces();
}

gameLoop();





canvas.addEventListener('mousedown', function(e) {
    if (!draggedPiece) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / SQUARE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / SQUARE_SIZE);
        draggedPiece = getPieceAtSquare(x, y);
        if (draggedPiece) {
            draggedPieceX = e.clientX - rect.left;
            draggedPieceY = e.clientY - rect.top;
            possibleMoves = game.moves({square: draggedPiece.square, verbose: true}).map(move => move.to);
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (draggedPiece) {
        const rect = canvas.getBoundingClientRect();
        draggedPieceX = e.clientX - rect.left;
        draggedPieceY = e.clientY - rect.top;
        drawBoard();
    }
});

canvas.addEventListener('mouseup', function(e) {
    if (draggedPiece) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / SQUARE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / SQUARE_SIZE);
        movePiece(draggedPiece, x, y);
        draggedPiece = null;
        possibleMoves = []; // Clear the possible moves
        drawBoard();
    }
});


function drawBoard() {
    // Draw the squares
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = String.fromCharCode('a'.charCodeAt(0) + i) + (8 - j);
            ctx.fillStyle = (i + j) % 2 === 0 ? '#DDB88C' : '#A66D4F';
            ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
    }

    // Highlight the possible moves
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = String.fromCharCode('a'.charCodeAt(0) + i) + (8 - j);
            if (possibleMoves.includes(square)) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            }
        }
    }

    // Draw the pieces
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = String.fromCharCode('a'.charCodeAt(0) + i) + (8 - j);
            const piece = game.get(square);
            if (piece && (!draggedPiece || square !== draggedPiece.square)) {
                const image = images[piece.color][piece.type];
                ctx.drawImage(image, i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            }
        }
    }

    // If a piece is being dragged, draw it at the dragged position
    if (draggedPiece) {
        const image = images[draggedPiece.color][draggedPiece.type];
        if (draggedPieceX >= 0 && draggedPieceX <= 8 * SQUARE_SIZE && draggedPieceY >= 0 && draggedPieceY <= 8 * SQUARE_SIZE) {
            ctx.drawImage(image, draggedPieceX - SQUARE_SIZE / 2, draggedPieceY - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
        }
    }
}


// Function to get the piece at a given square
function getPieceAtSquare(x, y) {
    // Convert the x and y coordinates to a square name
    const square = String.fromCharCode('a'.charCodeAt(0) + x) + (8 - y);
    // Get the piece at the square
    const piece = game.get(square);
    if (piece) {
        piece.square = square; // Add this line
    }
    return piece;
}

// Function to move a piece to a new square
function movePiece(piece, x, y) {
    // Convert the x and y coordinates to a square name
    const square = String.fromCharCode('a'.charCodeAt(0) + x) + (8 - y);
    // Try to move the piece to the square
    const move = game.move({from: piece.square, to: square, promotion: 'q'}); // Always promote to a queen for simplicity
    // If the move is legal, update the piece's square
    if (move) {
        piece.square = square;
        if (move.captured) {
            if (move.color === 'w') {
                capturedBlackPieces.push(move.captured);
            } else {
                capturedWhitePieces.push(move.captured);
            }
        }
        // Redraw the captured pieces
        drawCapturedPieces();
    }
}



// In the drawCapturedPieces function, clear the canvas and then draw the images of the captured pieces
function drawCapturedPieces() {
    let ctx = capturedWhitePiecesCanvas.getContext('2d');
    ctx.clearRect(0, 0, capturedWhitePiecesCanvas.width, capturedWhitePiecesCanvas.height);
    let pieceSize = capturedWhitePiecesCanvas.width; // The size of each square on the canvas
    let maxPieces = Math.floor(capturedWhitePiecesCanvas.height / pieceSize); // The maximum number of pieces that can be displayed on the canvas
    for (let i = 0; i < Math.min(capturedWhitePieces.length, maxPieces); i++) {
        const image = images['w'][capturedWhitePieces[i]];
        ctx.drawImage(image, 0, i * pieceSize, pieceSize, pieceSize); // Draw the image in the square
    }

    ctx = capturedBlackPiecesCanvas.getContext('2d');
    ctx.clearRect(0, 0, capturedBlackPiecesCanvas.width, capturedBlackPiecesCanvas.height);
    pieceSize = capturedBlackPiecesCanvas.width; // The size of each square on the canvas
    maxPieces = Math.floor(capturedBlackPiecesCanvas.height / pieceSize); // The maximum number of pieces that can be displayed on the canvas
    for (let i = 0; i < Math.min(capturedBlackPieces.length, maxPieces); i++) {
        const image = images['b'][capturedBlackPieces[i]];
        ctx.drawImage(image, 0, i * pieceSize, pieceSize, pieceSize); // Draw the image in the square
    }
}



// Start the game loop
gameLoop();

};