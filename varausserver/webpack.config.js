const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  name: "varaus-server",
  target: "node",
  entry: "./src/server.js",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "index.js",
    libraryTarget: "commonjs2",
    clean: false
  },
  externals: /^[a-z\-0-9]+$/,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.png$/,
        type: "asset/resource"
      },
      {
        test: /\.jpg$/,
        type: "asset/resource"
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/*.json", to: "[name][ext]" }
      ]
    })
  ],
  resolve: {
    extensions: [".js", ".json"]
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development"
};
