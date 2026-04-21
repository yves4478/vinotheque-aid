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

      // Walk the Podfile line by line, tracking Ruby block depth to find the
      // closing `end` of the `post_install do |installer|` block and insert
      // the patch just before it.
      const BLOCK_OPEN = /\b(do|if|unless|begin|case|def|class|module)\b/;
      const BLOCK_CLOSE = /^\s*end\s*$/;

      const lines = podfile.split("\n");
      let inPostInstall = false;
      let depth = 0;
      let insertIdx = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!inPostInstall) {
          if (line.includes("post_install do |installer|")) {
            inPostInstall = true;
            depth = 1;
          }
          continue;
        }

        // Count opens/closes inside the post_install block
        const opens  = (line.match(BLOCK_OPEN) || []).length;
        const closes = BLOCK_CLOSE.test(line) ? 1 : 0;
        depth += opens - closes;

        if (depth === 0) {
          // This line is the closing `end` of post_install — insert before it
          insertIdx = i;
          break;
        }
      }

      if (insertIdx !== -1) {
        lines.splice(insertIdx, 0, patch);
        fs.writeFileSync(podfilePath, lines.join("\n"));
      }

      return config;
    },
  ]);
};
