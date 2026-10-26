import {defineConfig} from 'vite';

export default defineConfig({
  // GitHub Pages serves project repositories under /<repo-name>/.
  // Keep the ordinary local build at /, and let CI set BASE_PATH for Pages.
  base: process.env.BASE_PATH || '/',
});
