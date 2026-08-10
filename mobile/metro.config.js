const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const workspaceRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// The domain layer — types, expiry maths, branch labels, seed data — lives in
// the web app and is plain TypeScript with no DOM in it. Sharing it rather than
// copying keeps one source of truth for the rules a wrong answer would cost
// real money: when a card expires, what a point is worth.
config.watchFolders = [path.resolve(workspaceRoot, "src")];
config.resolver.extraNodeModules = {
  "@": path.resolve(workspaceRoot, "src"),
};
// Only this app's node_modules — the web app's must not leak in and give us a
// second copy of React.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = config;
