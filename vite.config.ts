import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(), 
      isDevelopment && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    build: {
      // Enable source maps for debugging
      sourcemap: isDevelopment,
      // Optimize bundle size
      minify: isProduction,
      target: "es2015",
      // Enable code splitting
      rollupOptions: {
        output: {
          // Split vendor and app code
          manualChunks: {
            vendor: ['react', 'react-dom', 'recharts', 'date-fns'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],
            utils: ['date-fns-tz', 'clsx', 'tailwind-merge'],
          },
          // Optimize chunk size
          chunkFileNames: isProduction 
            ? "assets/[name]-[hash].js" 
            : "assets/[name].js",
        },
      },
      // Set performance budgets
      chunkSizeWarningLimit: 500, // 500KB
      assetsInlineLimit: 4096, // 4KB
    },
    // Enable experimental features for better performance
    experimental: {
      // renderBuiltUrl is now a build option, not experimental
      // optimizeDeps: {
      //   include: ['react', 'react-dom', 'recharts'],
      // },
    },
    // Define performance budgets
    define: {
      // Enable performance monitoring in development
      __DEV_PERFORMANCE_MONITORING__: isDevelopment,
      // Enable bundle analyzer in development
      __DEV_BUNDLE_ANALYZER__: isDevelopment,
    },
  };
}) as any;
