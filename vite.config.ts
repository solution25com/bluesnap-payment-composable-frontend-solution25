import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: false, // Ensures CSS is extracted
    lib: {
      entry: 'src/index.js',
      name: 'MyLibrary',
      fileName: (format) => `my-library.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'], // Prevent bundling Vue
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
