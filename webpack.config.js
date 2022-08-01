const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = [
  {
    context: __dirname,
    target: 'web',
    devtool: "source-map",
    entry: {
      popup: path.resolve(__dirname, 'src/popup/main.tsx'),
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    plugins: [new NodePolyfillPlugin()],

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  },
  {
    context: __dirname,
    target: 'web',
    devtool: "source-map",
    entry: {
      enum: path.resolve(__dirname, 'src/type.ts'),
      type: path.resolve(__dirname, 'src/type.ts'),
      utils: path.resolve(__dirname, 'src/utils.ts'),
      background: path.resolve(__dirname, 'src/background.ts'),
      'inject-script': path.resolve(__dirname, 'src/inject-script.ts'),
      'content-script': path.resolve(__dirname, 'src/content-script.ts'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, 'src'),
            from: '**/*',
            globOptions: {
              ignore: [
                '**/popup/*',
                '**/enum.ts',
                '**/type.ts',
                '**/utils.ts',
                '**/background.ts',
                '**/inject-script.ts',
                '**/content-script.ts',
              ],
            },
          },
        ],
      }),
    ],
  },
];
