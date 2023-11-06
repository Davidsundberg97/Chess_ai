// Import the necessary libraries
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
require('firebase/compat/storage');
const tf = require('@tensorflow/tfjs');
const { log } = require('console');
const Chess = require('chess.js').Chess;

// Import the necessary functions from Chess.js and model.js


let Q = {};

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase configuration here
  apiKey: "AIzaSyBrh_RA4ZzqeDtw8-AbiGDgY4WzyqK0X0w",
            authDomain: "chess-c0a89.firebaseapp.com",
            projectId: "chess-c0a89",
            storageBucket: "chess-c0a89.appspot.com",
            messagingSenderId: "308918904379",
            appId: "1:308918904379:web:d438a897bf640154929e1e",
            measurementId: "G-2CYK2Z36PZ"
};
firebase.initializeApp(firebaseConfig);

// Get a reference to the Firestore database
const db = firebase.firestore();

// Variable to store the game histories
let gameHistories = [];

// Fetch the game histories from the Firestore database
db.collection('games').get().then((querySnapshot) => {
    gameHistories = querySnapshot.docs.map(doc => doc.data().history);

    //show all the game histories
    console.log(gameHistories);
    console.log('Initial model summary:');
    model.summary();

      // Train the model
    trainModel(model, gameHistories);

    console.log('Model summary after training:');
    model.summary();

});

function initializeModel() {
    // Create a sequential model
    const model = tf.sequential();
  
    // Add the first layer
    model.add(tf.layers.dense({
      units: 128,  // Number of nodes in the first layer
      activation: 'relu',  // Activation function for the first layer
      inputShape: [64]  // Input shape for the first layer. This should match the shape of your input data.
    }));
  
    // Add the second layer
    model.add(tf.layers.dense({
      units: 64,  // Number of nodes in the second layer
      activation: 'relu',  // Activation function for the second layer
    }));

    // Add a dropout layer
    model.add(tf.layers.dropout({ rate: 0.5 }));
  
    // Add the output layer
    model.add(tf.layers.dense({
      units: 64,  // Number of nodes in the output layer. This should match the shape of your output data.
      activation: 'sigmoid',  // Activation function for the output layer
    }));
  
    // Compile the model
    model.compile({
      optimizer: 'adam',  // Optimization algorithm to use
      loss: 'binaryCrossentropy',  // Loss function to use
      metrics: ['accuracy'],  // Metrics to track during training
    });
  
    // Return the model
    return model;
  }

// Create a new model
const model = initializeModel();

function getReward(game) {
    const lastMove = game.history({ verbose: true }).slice(-1)[0];
    let reward = 0;

    if (lastMove && lastMove.captured) {
      if (lastMove.color !== 'b') {  // Assuming 'b' is the color of the AI
        // Decrease the reward if the AI's piece was captured
        reward -= 50;
      } else {
          // Increase the reward if a piece was captured
          reward += 50;
      }
    }

    if (game.isCheckmate() === 'b') {  // Assuming 'b' is the color of the AI
      // Decrease the reward if the AI is in checkmate
      reward -= 100;
    } else if (game.isCheckmate() === 'w') {
        // Increase the reward if the opponent is in checkmate
        reward += 100;
    } else if (game.isDraw()) {
        // Decrease the reward if the game is in a draw
        reward -= 100;
    }

    return reward;
}

function isSAN(move) {
    // This regex covers more SAN moves, including piece moves like 'Nc3' and captures like 'exf5'
    const regex = /^([PNBRQK])?([a-h][1-8])?(x)?([a-h][1-8])(q|r|b|n)?$/i;
    return regex.test(move);
}

async function trainModel(model, gameHistories) {
    const alpha = 0.7;  // Learning rate
    const gamma = 0.9;  // Discount factor

    // Create arrays to store the training data and labels
    const trainingData = [];
    const trainingLabels = [];

    for (const history of gameHistories) {
        const moves = history;
        const game = new Chess();

        console.log('Starting a new game history...');

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            console.log(`Processing move ${i}: ${move}`);

  
            console.log(game.ascii());
            game.move(move);

            const state = convertGameStateToInput(game);
            const action = convertMoveToOutput(move);

            console.log(`State: ${state}`);
            console.log(`Action: ${action}`);
            if (game.isGameOver()) {
                console.log(`Game over after move ${i}: ${move}`);
            }

            if (!(state in Q)) {
                Q[state] = {};
            }

             const reward = getReward(game);

        

             let nextState = null;
             if (i < moves.length - 1) {
                 const nextGame = new Chess(game.fen());
                 nextGame.move(moves[i + 1]);
                 nextState = convertGameStateToInput(nextGame);
             }

            const oldQValue = state in Q && action in Q[state] ? Q[state][action] : 0;
            const maxFutureQValue = nextState && nextState in Q ? Math.max(...Object.values(Q[nextState])) : 0;

            Q[state][action] = oldQValue + alpha * (reward + gamma * maxFutureQValue - oldQValue);

            // Add the state and Q-value to the training data and labels
            trainingData.push(convertGameStateToInput(game));
            trainingLabels.push([Q[state][action]]);
        }
    }

    /// Assume `moves` is an array of move objects
    var targetValuesArray = trainingLabels.map(convertMoveToOutput);

    // Convert the array to a tensor and reshape it
    const targetValues = tf.tensor2d(targetValuesArray);
    const reshapedTargetValues = targetValues.reshape([trainingLabels.length, 64]);

    // Convert the training data to a tensor
    const trainingDataTensor = tf.tensor2d(trainingData, [trainingData.length, 64]);
    const weightsBeforeTraining = model.getWeights();

    // Train the model on the training data and reshaped target values
    await model.fit(trainingDataTensor, reshapedTargetValues, {
      epochs: 100,  // Number of epochs to train for
      callbacks: {
          onEpochBegin: (epoch, logs) => {
              // Log the weights before training
              model.getWeights().forEach((weight, index) => {
                  console.log(`Weights in layer ${index} before training:`, weight.dataSync());
              });
          },
          onEpochEnd: (epoch, logs) => {
              // Log the weights after training
              model.getWeights().forEach((weight, index) => {
                  console.log(`Weights in layer ${index} after training:`, weight.dataSync());
              });

              let weights = model.getWeights();
              let weightsContainNaN = weights.some(weight => tf.isNaN(weight).any().dataSync()[0]);

              console.log(`Epoch ${epoch + 1} ended. Loss: ${logs.loss}. Weights contain NaN: ${weightsContainNaN}`);
          },
      },
    });

    const weightsAfterTraining = model.getWeights();

  for (let i = 0; i < weightsBeforeTraining.length; i++) {
      const areWeightsEqual = weightsBeforeTraining[i].equal(weightsAfterTraining[i]).all().dataSync()[0];
      console.log(`Weights in layer ${i} are ${areWeightsEqual ? 'equal' : 'not equal'}`);
  }

    
      


        // Save the model's topology and weights
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (modelArtifacts) => {
        if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
            modelArtifacts.modelTopology = new TextDecoder().decode(modelArtifacts.modelTopology);
        }
        return modelArtifacts;
    }));

    // Upload the model's topology to Firebase Storage
    const storageRef = firebase.storage().ref();
    const modelRef = storageRef.child('model.json');
    await modelRef.putString(JSON.stringify(modelArtifacts));

    // Upload the model's weights to Firebase Storage
    if (modelArtifacts.weightData) {
        const weightsRef = storageRef.child('model.weights.bin');
        console.log(modelArtifacts.weightData);
        if (modelArtifacts.weightData instanceof ArrayBuffer) {
            const uint8Array = new Uint8Array(modelArtifacts.weightData);
            await weightsRef.put(uint8Array);
        } else {
            console.error('modelArtifacts.weightData is not an ArrayBuffer');
        }
    } else {
        console.error('modelArtifacts.weightData is undefined');
    }

    console.log('Model saved to Firebase!');
      
      
      //const saveResult = await model.save(tf.io.withSaveHandler(modelArtifactsHandler));
    
}

// Define your evaluation data and labels here
const evaluationData = gameHistories.slice(0, 100).map(history => {
    const game = new Chess();
    const moves = history.split(' ');
  
    moves.forEach(move => {
      game.move(move);
    });
  
    return convertGameStateToInput(game);
  });
  const evaluationLabels = gameHistories.slice(0, 100).map(history => {
    const moves = history.split(' ');
    return convertMoveToOutput(moves[moves.length - 1]);
  });
  const evaluationDataTensor = tf.tensor2d(evaluationData, [evaluationData.length, 64]);
  const evaluationLabelsTensor = tf.tensor2d(evaluationLabels, [evaluationLabels.length, 64]);


// Define your new data here
const newData = gameHistories.slice(100, 200).map(history => {
    const game = new Chess();
    const moves = history.split(' ');
  
    moves.forEach(move => {
      game.move(move);
    });
  
    return convertGameStateToInput(game);
  });

  if (evaluationData.length > 0 && evaluationLabels.length > 0) {
    const evaluationDataTensor = tf.tensor2d(evaluationData, [evaluationData.length, 64]);
    const evaluationLabelsTensor = tf.tensor2d(evaluationLabels, [evaluationLabels.length, 64]);
  
    // Evaluate the model
    model.evaluate(evaluationDataTensor, evaluationLabelsTensor);
  }
  
  // Define your new data here
  if (newData.length > 0) {
    const newDataTensor = tf.tensor2d(newData, [newData.length, 64]);
  
    // Make predictions on new data
    const predictions = model.predict(newDataTensor);
    console.log(predictions);
  }



// Define the convertGameStateToInput and convertMoveToOutput functions
function convertGameStateToInput(game) {
    // Your code here
    const board = game.board();
    const input = [];
  
    // Convert the board to a 8x8 matrix
    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece === null) {
          row.push(0);
        } else {
          // Assign a unique number to each piece type and color
          const value = piece.color === 'w' ? 1 : -1;
          switch (piece.type) {
            case 'p':
              row.push(value * 1);
              break;
            case 'r':
              row.push(value * 2);
              break;
            case 'n':
              row.push(value * 3);
              break;
            case 'b':
              row.push(value * 4);
              break;
            case 'q':
              row.push(value * 5);
              break;
            case 'k':
              row.push(value * 6);
              break;
          }
        }
      }
      input.push(row);
    }
  
    // Flatten the matrix and return it as the input
    return input.flat();
  }
  
  function convertMoveToOutput(move) {
    // Initialize an array with 64 zeros
    var output = Array(64).fill(0);

    // Convert the move to a string in the format 'e2e4'
    var moveStr = String(move.from) + String(move.to);

    // Convert the move string to indices in the output array
    var fromIndex = convertSquareToIndex(moveStr.substring(0, 2));
    var toIndex = convertSquareToIndex(moveStr.substring(2, 4));

    // Set the corresponding elements in the output array to 1
    output[fromIndex] = 1;
    output[toIndex] = 1;

    return output;
  }

  function convertSquareToIndex(square) {
    // Convert a square string (e.g., 'e2') to an index in the output array
    var file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    var rank = 8 - parseInt(square[1]);
    return rank * 8 + file;
}