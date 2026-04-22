// Xcode 16 rejects consteval usage in RN 0.76's bundled fmt/glog library.
// Only the glog pod gets gnu++17 — other pods need C++20 (e.g. for std::unordered_map::contains).
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
        "  # glog needs gnu++17 (fmt consteval bug in Xcode 16); all other pods need gnu++20",
        "  installer.pods_project.targets.each do |target|",
        "    target.build_configurations.each do |cfg|",
        "      cfg.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = ['glog', 'fmt'].include?(target.name) ? 'gnu++17' : 'gnu++20'",
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
