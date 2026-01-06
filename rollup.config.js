import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom', 'react/jsx-runtime'];

export default [
  // Main bundle (UMD + ESM)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external,
  },
  
  // React bundle
  {
    input: 'src/react/index.ts',
    output: [
      {
        file: 'dist/react/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/react/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external,
  },
  
  // CSS
  {
    input: 'src/styles.css',
    output: {
      file: 'dist/styles.css',
      assetFileNames: '[name][extname]',
    },
    plugins: [
      postcss({
        extract: 'styles.css',
        minimize: true,
        sourceMap: true,
      }),
    ],
    onwarn(warning, warn) {
      // Suppress empty chunk warning for CSS-only input
      if (warning.code === 'EMPTY_BUNDLE') return;
      // Suppress file overwrite warning (expected behavior for CSS extraction)
      if (warning.code === 'FILE_NAME_CONFLICT') return;
      warn(warning);
    },
  },
  
  // Type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
  
  // React type declarations
  {
    input: 'src/react/index.ts',
    output: {
      file: 'dist/react/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
];
