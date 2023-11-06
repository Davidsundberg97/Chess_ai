import { initializeModel, convertGameStateToInput } from './model.js';

// Now you can use these functions in this file

//let input = convertGameStateToInput(game);

window.onload = async function() {
    // Your JavaScript code goes here
    let model = await initializeModel();
    console.log(model, 'model');

    const tensor = tf.tensor([1, 2, 3, 4]);

    // Perform an operation on the tensor
    const squaredTensor = tensor.square();

    // Print the result to the console
    squaredTensor.print();

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

let isMoveBeingMade = false;

// Start the game loop
function gameLoop() {
    drawBoard();
   // console.log('Turn:', game.turn(), 'Is move being made:', isMoveBeingMade);
    if (game.turn() === 'b') {
      //  console.log("It's black's turn");
    }
        if (game.turn() === 'b' && !isMoveBeingMade) {
            console.log('makePredictedMove called');
            
            makePredictedMove();
        }
    // Check if the game is over
    if (game.game_over()) {

        // Get the game history
        const history = game.history();

        // Get a reference to the Firestore database
        var db = firebase.firestore();

        // Add a new document with the game history
        db.collection("games").add({
            history: history
        })
        .then(function(docRef) {
            console.log("Game saved with ID: ", docRef.id);
        })
        .catch(function(error) {
            console.error("Error saving game: ", error);
        });

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




function makePredictedMove() {
    console.log('makePredictedMove called');
     isMoveBeingMade = true;

     // Save the current game state
     console.log('Game state:', game.fen());
     const input = convertGameStateToInput(game);
        //console.log(input , 'Here');

     // Assuming `input` is your input data
     let inputTensor = tf.tensor2d([input]);  // Convert the 1D array to a 2D array
    
     console.log(inputTensor.shape , 'Here');  // Print the shape of the inputTensor
       // console.log(inputTensor.dataSync() , 'Here');  // Print the data of the inputTensor

     // Use the model to predict the next move
     const output = model.predict(inputTensor);
 
     // Interpret the output to determine the next move
     const move = interpretOutput(output);
     for (let i = 0; i < 10; i++) {
        const input = tf.randomNormal([1, 64]);
        const output = model.predict(input);
        //console.log(`Input ${i}:`, Array.from(input.dataSync()));
        //console.log(`Output ${i}:`, Array.from(output.dataSync()));
    }
 
    // Wait for 2 seconds before making the move
    if(game.turn() === 'b') {
        setTimeout(function() {
            // Make the move
            game.move(move);
            // Calculate the reward
            //console.log('Reward:', reward);
            isMoveBeingMade = false;
        }, 1000);
    }   
}


function interpretOutput(output) {
    // This function should convert the output of the model into a move
    // The output is an array of length 64
    // The index with the highest value represents the square to move to
    // For example, if the output is [0, 0, 0, 0.5, 0, 0, 0, 0, ..., 0]
    // then the AI should move to square d2 (index 3)
    //console.log(output);
    const outputArray = output.dataSync();
    //console.log('Output array:', outputArray);
    //console.log('Output array length:', outputArray.length);
    //console.log('Output shape:', output.shape);
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < outputArray.length; i++) {
        if (outputArray[i] > maxValue) {
            maxValue = outputArray[i];
            maxIndex = i;
        }
    }
    console.log('Max index:', maxIndex);
    console.log('Max value:', maxValue);
    //console.log('Move:', game.moves({verbose: true})[maxIndex]);
    return game.moves({verbose: true})[maxIndex];
}


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
    if (game.turn() === 'b') {
        // Calculate legal squares
        const legalMoves = game.moves({verbose: true});
        const legalSquares = legalMoves.map(move => move.to);

        // Calculate outputArray
        const input = convertGameStateToInput(game);
        let inputTensor = tf.tensor2d([input]);  // Convert the 1D array to a 2D tensor and provide the shape
        // Check if any elements of the input are NaN
        let containsNaN = false;
        for (let i = 0; i < input.length; i++) {
            if (isNaN(input[i])) {
                containsNaN = true;
                break;
            }
        }




        const output = model.predict(inputTensor);
        //console.log('Output:', output);
        let outputData = output.dataSync();  // Get the data from the tensor

        let outputContainsNaN = false;
        for (let i = 0; i < outputData.length; i++) {
        if (isNaN(outputData[i])) {
            outputContainsNaN = true;
            break;
        }
        }

        //console.log('Output contains NaN:', outputContainsNaN);

        const outputArray = output.dataSync();
        //console.log('Output array:', outputArray);
        //console.log('Output array length:', outputArray.length);
        //console.log('Output shape:', output.shape);
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = String.fromCharCode('a'.charCodeAt(0) + i) + (8 - j).toString();
                if (legalSquares.includes(square)) {
                    const value = outputArray[i * 8 + j];  // Access the value from the 1D array
                    //i want to log the highes value and square and also output it in the canvas
                    if (value > 0.5) {
                        //console.log(`Value for square ${square}:`, value);
                    }
                    const scaledValue = Math.pow(value, 0.5);  // Use a power scale
                    //console.log(`Scaled value for square ${square}:`, scaledValue);
                    ctx.fillStyle = `rgba(144, 238, 144, ${scaledValue})`; // light green with transparency
                    ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        
                    // Draw the percentages
                    ctx.fillStyle = 'black';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((value * 100).toFixed(2) , (i + 0.5) * SQUARE_SIZE, (j + 0.5) * SQUARE_SIZE);
                }
            }
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