import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  // minified UMD build:
  {
    input: 'src/index.js',
    output: {
      name: 'reduxedChromeStorage',
      file: pkg.main,
      format: 'umd'
    },
    plugins: [
      resolve(),
      commonjs(),
      buble({
        transforms: { dangerousForOf: true },
        exclude: ['node_modules/**']
      }),
      terser({
        compress: {
          drop_console: true,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    ]
  },
  // ES module build:
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es'
    }
  }
];
