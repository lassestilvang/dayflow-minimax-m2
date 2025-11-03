import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/fixtures/**',
        '**/mocks/**',
      ],
    },
    server: {
      deps: {
        inline: [
          '@dnd-kit/core',
          '@dnd-kit/sortable',
          '@dnd-kit/utilities',
          '@hookform/resolvers',
          '@radix-ui/**',
          'class-variance-authority',
          'clsx',
          'date-fns',
          'drizzle-kit',
          'drizzle-orm',
          'framer-motion',
          'lucide-react',
          'react-day-picker',
          'react-hook-form',
          'tailwind-merge',
          'zod',
          'zustand',
        ],
        external: [],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    target: 'node18',
    platform: 'node',
  },
})