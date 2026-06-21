import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        'react-native': 'react-native-web',
        'lucide-react-native': 'lucide-react',
        'react-native-config': path.resolve(__dirname, './src/config/react-native-config-mock.ts'),
      },
      extensions: [
        '.web.js',
        '.web.ts',
        '.web.tsx',
        '.js',
        '.ts',
        '.tsx',
      ],
    },
    define: {
      __DEV__: true,
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.API_URL': JSON.stringify(env.API_URL || 'http://localhost:8787'),
      'process.env.DELL_URL': JSON.stringify(env.DELL_URL || 'http://localhost:9182'),
      'process.env.API_VERSION': JSON.stringify(env.API_VERSION || '/api/v1/'),
    },
  };
});

