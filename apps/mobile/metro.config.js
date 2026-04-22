const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

// Watch workspace root so Metro sees packages/core
config.watchFolders = [workspaceRoot];

// Resolve from both the app and the workspace root
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  workspaceNodeModules,
];

const forcedMobileModules = ["react-native-screens", "react-native-svg"];

function isForcedMobileModule(moduleName, packageName) {
  return moduleName === packageName || moduleName.startsWith(`${packageName}/`);
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const forcedPackage = forcedMobileModules.find((packageName) =>
    isForcedMobileModule(moduleName, packageName),
  );

  if (forcedPackage) {
    return context.resolveRequest(
      context,
      path.join(mobileNodeModules, ...moduleName.split("/")),
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
