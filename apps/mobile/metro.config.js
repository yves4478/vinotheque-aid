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

// Exclude react-native-screens Fabric (New Architecture) components — not
// needed with newArchEnabled: false and their undefined prop types crash Metro.
config.resolver.blockList = [
  /node_modules\/react-native-screens\/src\/fabric\/.*/,
];

module.exports = config;
