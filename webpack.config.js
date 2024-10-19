import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ESLintPlugin from 'eslint-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  mode: 'production',
  target: 'node',
  output: {
    filename: 'index.cjs',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [new ESLintPlugin({ extensions: ['ts'], fix: false })],
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: 'ts-loader',
        exclude: ['/node_modules/'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
    },
  },
};

export default config;
