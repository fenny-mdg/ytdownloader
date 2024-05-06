import { flatRoutes } from "remix-flat-routes";

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
  serverModuleFormat: "esm",
  watchPaths: ["./@/**/*", "./tailwind.config.ts"],
  tailwind: true,
  serverPlatform: "node",
  // postcss: true,
  routes: async (defineRoutes) => {
    return flatRoutes("routes", defineRoutes, {
      ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
    });
  },
  browserNodeBuiltinsPolyfill: {
    modules: {
      stream: true,
      querystring: true,
      string_decoder: true,
      http: true,
      https: true,
      timers: true,
      vm: true,
    },
  },
};
