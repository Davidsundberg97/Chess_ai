# Chess AI Training

This repository contains the code for training a chess AI using TensorFlow.js.

## Code Explanation

The main part of the code is a training loop for a neural network model. Here's a brief explanation of what the code does:

1. **Prepare the Training Data:** The training data and labels are converted to tensors, which are multi-dimensional arrays with a uniform type. TensorFlow.js operates on tensors.

2. **Reshape the Target Values:** The target values tensor is reshaped to match the expected output shape of the neural network.

3. **Get Initial Weights:** The initial weights of the model are retrieved and logged.

4. **Train the Model:** The model is trained on the training data for a specified number of epochs. An epoch is one complete pass through the entire training dataset.

5. **Callbacks:** The `onEpochBegin` and `onEpochEnd` callbacks are used to log the weights of the model before and after each epoch. This can be useful for debugging and understanding how the model is learning.

6. **Check for NaN Weights:** After each epoch, the code checks if any of the weights have become NaN (Not a Number). This can happen if the learning rate is too high or if there's a bug in the code.

## Usage

To train the model, run the `train` function with your training data and labels. The function will return the trained model.

## Requirements

This code requires TensorFlow.js. You can install it with npm:

```bash
npm install @tensorflow/tfjs
