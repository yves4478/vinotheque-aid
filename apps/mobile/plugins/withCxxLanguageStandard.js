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

      // Insert before the final `end` of the file (closes post_install block)
      const lines = podfile.split("\n");
      let lastEndIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === "end") {
          lastEndIdx = i;
          break;
        }
      }
      if (lastEndIdx !== -1) {
        lines.splice(lastEndIdx, 0, patch);
        podfile = lines.join("\n");
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};
