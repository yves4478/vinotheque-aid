// Xcode 16 enforces C++20 strictly, which breaks RN 0.76's bundled fmt library
// (consteval usage in FMT_STRING macro). Forcing gnu++17 for all pods fixes it.
const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

module.exports = function withCxxLanguageStandard(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      if (!fs.existsSync(podfilePath)) return config;

      let podfile = fs.readFileSync(podfilePath, "utf8");
      if (podfile.includes("CLANG_CXX_LANGUAGE_STANDARD")) return config;

      const patch = [
        "  # Fix: fmt consteval incompatible with Xcode 16 C++20 — use gnu++17",
        "  installer.pods_project.targets.each do |target|",
        "    target.build_configurations.each do |cfg|",
        "      cfg.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'",
        "    end",
        "  end",
      ].join("\n");

      // Find react_native_post_install( and locate its closing ) by counting
      // parentheses, then insert the patch on the next line — guaranteed to be
      // inside the post_install do |installer| block.
      const callStart = podfile.lastIndexOf("react_native_post_install(");
      if (callStart === -1) return config;

      let depth = 0;
      let insertAt = -1;
      for (let i = callStart; i < podfile.length; i++) {
        if (podfile[i] === "(") depth++;
        else if (podfile[i] === ")") {
          depth--;
          if (depth === 0) {
            const lineEnd = podfile.indexOf("\n", i);
            insertAt = lineEnd !== -1 ? lineEnd + 1 : podfile.length;
            break;
          }
        }
      }

      if (insertAt !== -1) {
        podfile =
          podfile.slice(0, insertAt) + patch + "\n" + podfile.slice(insertAt);
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};
