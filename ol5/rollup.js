// Rollup configuration for the full build

import noderesolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {uglify} from 'rollup-plugin-uglify';
import buble from 'rollup-plugin-buble';
import sourcemaps from 'rollup-plugin-sourcemaps';

const prod = process.env.BUILD === 'production';

const plugins = [
  noderesolve(),
  commonjs(),
  buble(),
];

const uglifyPlugin = uglify({
    compress: {
      sequences: false, // workaround uglify bug with sequences
      drop_console: true
    }
  });

if (prod) {
  plugins.push(uglifyPlugin);
}

plugins.push(sourcemaps());

export default {
  input: 'build/index.js',
  output: [
    {file: prod ? 'build/ol.js' : 'build/ol-debug.js', format: 'iife', sourcemap: true}
  ],
  plugins
};
