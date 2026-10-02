import { defineConfig } from 'tsdown'
import license from 'rollup-plugin-license';

const licenseOpts = {
  sourcemap: false,
  banner: {
    content: { file: 'src/license.tpl.txt' }
  }
};

export default defineConfig({
  dts: true,
  exports: true,
  // ...config options
  entry: 'src/index.ts',
  plugins: [ license(licenseOpts) ],
  deps: {
    onlyBundle: [ 'uuid' ]
  }
})
