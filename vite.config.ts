import path from 'node:path'

import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import { visualizer } from 'rollup-plugin-visualizer'

import type { UserConfig } from 'vite'

export default {
  resolve: {
    alias: {
      // react-native-web-webview ships a .html file that Rolldown tries to parse as JS.
      // We never use it on web (SermonYoutubePlayer renders a plain <iframe> on web).
      'react-native-web-webview': path.resolve(__dirname, 'src/features/church/youtube/webviewStub.ts'),
    },
  },

  /**
   * Default Vite exposes only `VITE_*` to `import.meta.env`. Church app vars follow the PRD
   * names (`ENGAGE_GIVE_URL`, `YOUTUBE_*`, `WORDPRESS_*`, `CHURCH_*`) — add prefixes here so
   * `src/config/churchEnv.ts` can read a single name per concern (no duplicate VITE_ aliases).
   */
  envPrefix: ['VITE_', 'ENGAGE_', 'YOUTUBE_', 'WORDPRESS_', 'CHURCH_'],

  server: {
    allowedHosts: ['host.docker.internal'],
  },

  optimizeDeps: {
    include: ['async-retry'],
    exclude: ['oxc-parser', 'react-native-web-webview'],
  },

  ssr: {
    // we set this as it generally improves compatability by optimizing all deps for node
    noExternal: true,
    // @rocicorp/zero must be external to prevent Symbol mismatch between
    // @rocicorp/zero and @rocicorp/zero/server - they share queryInternalsTag
    // Symbol that must be the same instance for query transforms to work
    external: [
      'on-zero',
      '@vxrn/mdx',
      '@rocicorp/zero',
      'retext',
      'retext-smartypants',
      '@opentelemetry/api',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/core',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
    ],
  },

  plugins: [
    tamaguiPlugin(
      // see tamagui.build.ts for configuration
    ),

    one({
      setupFile: {
        client: './src/setupClient.ts',
        native: './src/setupNative.ts',
        server: './src/setupServer.ts',
      },

      react: {
        compiler: process.env.NODE_ENV === 'production',
      },

      native: {
        bundler: 'rolldown',
      },

      router: {
        experimental: {
          typedRoutesGeneration: 'runtime',
        },
      },

      web: {
        experimental_scriptLoading: 'after-lcp-aggressive',
        inlineLayoutCSS: true,
        defaultRenderMode: 'spa',
        sitemap: {
          priority: 0.5,
          changefreq: 'weekly',
          exclude: [
            '/login/**',
            '/signup/**',
            '/profile-setup',
            '/avatar-setup',
            '/settings/**',
          ],
        },
      },

      build: {
        api: {
          config: {
            build: {
              rollupOptions: {
                external: [
                  '@rocicorp/zero',
                  'better-auth',
                  'better-auth/plugins',
                  'sharp',
                ],
              },
            },
          },
        },
      },
    }),

    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'bundle_stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            emitFile: true,
          }),
          visualizer({
            filename: 'bundle_stats.json',
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
            emitFile: true,
          }),
        ]
      : []),
  ],
} satisfies UserConfig
