const esbuild = require('esbuild');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

esbuild.build({
  entryPoints: ['main/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  platform: 'node',
  define: {
    'process.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
  },
}).catch(() => process.exit(1));