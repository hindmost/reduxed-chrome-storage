import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';
import license from 'rollup-plugin-license';
import pkg from './package.json';

const input = 'src/index.ts';
const name = 'reduxedChromeStorage';
const bubleOpts = {
  transforms: { dangerousForOf: true },
  include: ['src/**/*']
};
const licenseOpts = {
  sourcemap: false,
  banner: {
    content: { file: 'src/license.tpl.txt' }
  }
}

export default [
  // ES module:
  {
    input,
    output: {
      file: pkg.module,
      format: 'es'
    },
    plugins: [
      typescript({
        tsconfigOverride: { compilerOptions: { declaration: true } }
      }),
      license(licenseOpts),
      del({
        targets: ['dist/*.d.ts', '!dist/index.d.ts'],
        hook: 'writeBundle'
      })
    ]
  },
  // UMD Uncompressed:
  {
    input,
    output: {
      name,
      file: pkg.main,
      format: 'umd'
    },
    plugins: [
      typescript(),
      buble(bubleOpts),
      license(licenseOpts)
    ]
  },
  // UMD Compressed:
  {
    input,
    output: {
      name,
      file: pkg.unpkg,
      format: 'umd'
    },
    plugins: [
      typescript(),
      buble(bubleOpts),
      terser({
        compress: {
          drop_console: true,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      }),
      license(licenseOpts)
    ]
  }
];
