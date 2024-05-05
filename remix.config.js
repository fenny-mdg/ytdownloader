const { flatRoutes } = require("remix-flat-routes");

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
  serverModuleFormat: "cjs",
  watchPaths: ["./@/**/*"],
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
