// model.js
export async function initializeModel() {
    let model;
  
    try {
      model = await loadModelFromFirebase();
      console.log('Loaded model from Firebase');
      //console.log(model.summary());
    } catch (error) {
      console.error('Error loading model from Firebase:', error);
    }
  
    if (!model) {
      console.log('No model found, creating a new one');
      model = tf.sequential();
  
      model.add(tf.layers.dense({units: 128, activation: 'relu', inputShape: [64]}));
      model.add(tf.layers.dense({units: 256, activation: 'relu'}));
      model.add(tf.layers.dense({units: 128, activation: 'relu'}));
      model.add(tf.layers.dense({units: 64, activation: 'softmax'}));
  
      model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy'});
    }
  
    return model;
  }


  export function convertGameStateToInput(game) {
    const pieces = {'p': 1, 'r': 2, 'n': 3, 'b': 4, 'q': 5, 'k': 6,
                    'P': -1, 'R': -2, 'N': -3, 'B': -4, 'Q': -5, 'K': -6};
    let input = [];

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = String.fromCharCode('a'.charCodeAt(0) + j) + (8 - i).toString();
            const piece = game.get(square);
            //console.log(piece);
            input.push(piece ? pieces[piece.type] * (piece.color === 'w' ? 1 : -1) : 0);
        }
    }

    return input;
}

export async function loadModelFromFirebase() {
    // Get a reference to the storage service
    const storage = firebase.storage();
  
    // Create a storage reference from our storage service
    const modelRef = storage.ref('model.json');
  
    try {
      // Get the download URL
      const url = await modelRef.getDownloadURL();
      console.log('Model download URL:', url);
  
      // Load the model from the URL
      const model = await tf.loadLayersModel(url);
  
      return model;
    } catch (error) {
      console.error('Error loading model from Firebase:', error);
    }
  }