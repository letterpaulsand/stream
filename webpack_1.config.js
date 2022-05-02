const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
    entry: './src/start/index.js',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist/start'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
          {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, "css-loader"],
          },
          {
            test: /\.wav/,
            type: 'asset/resource'
          }
        ],
      },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve('./src/start/index.html'),
        }),
        new MiniCssExtractPlugin()
    ],
    
};