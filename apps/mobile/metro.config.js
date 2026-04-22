const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch workspace root so Metro sees packages/core
config.watchFolders = [workspaceRoot];

// Resolve from both the app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Block only the Fabric *NativeComponent files — they have undefined prop types
// that crash Metro with Old Architecture. NativeScreensModule is still needed.
config.resolver.blockList = [
  /node_modules\/react-native-screens\/src\/fabric\/.*NativeComponent\.(ts|tsx)$/,
];

module.exports = config;
