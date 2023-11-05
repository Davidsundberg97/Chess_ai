// model.js
export function initializeModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({units: 128, activation: 'relu', inputShape: [64]}));
    model.add(tf.layers.dense({units: 256, activation: 'relu'}));
    model.add(tf.layers.dense({units: 128, activation: 'relu'}));
    model.add(tf.layers.dense({units: 64, activation: 'softmax'}));

    model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy'});

    return model;
}


export function convertGameStateToInput(game) {
    const pieces = {'p': 1, 'r': 2, 'n': 3, 'b': 4, 'q': 5, 'k': 6,
                    'P': -1, 'R': -2, 'N': -3, 'B': -4, 'Q': -5, 'K': -6};
    let input = [];

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = game.get({row: i, col: j});
            input.push(piece ? pieces[piece.type] * (piece.color === 'w' ? 1 : -1) : 0);
        }
    }

    return tf.tensor(input).expandDims(0);
}