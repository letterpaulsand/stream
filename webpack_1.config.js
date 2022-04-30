const path = require('path');

module.exports = {
    entry: './public/start.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'start_bundle.js'
    },
    devtool: 'source-map'
};