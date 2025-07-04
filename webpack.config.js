const path = require('path');

module.exports = {
  entry: './index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              transpileOnly: false
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        type: 'asset/source'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: [
      path.resolve(__dirname),
      'node_modules'
    ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'AgentmanChatWidget',
      type: 'umd'
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
    umdNamedDefine: true
  },
  optimization: {
    minimize: true
  }
};