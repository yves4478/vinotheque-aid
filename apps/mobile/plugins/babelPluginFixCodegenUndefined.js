// React Native 0.76's Metro codegen parser does not understand namespace type
// references like `CT.DirectEventHandler` in react-native-screens 4.4.x.
// Normalize the source string that @react-native/babel-plugin-codegen parses,
// while leaving the AST intact so the plugin still generates native view configs.

const CODEGEN_TYPES = [
  "BubblingEventHandler",
  "DirectEventHandler",
  "Double",
  "Float",
  "Int32",
  "UnsafeMixed",
  "WithDefault",
];

function shouldPatch(filename) {
  return (
    filename.includes("react-native-screens") &&
    filename.includes("/fabric/")
  );
}

function getImportedNames(code) {
  const names = new Set();
  const importRegex = /import(?:\s+type)?\s*\{([^}]+)\}\s+from\s+['"][^'"]+['"];?/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    for (const part of match[1].split(",")) {
      const specifier = part.trim();
      if (!specifier) continue;

      const aliasMatch = specifier.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      names.add(aliasMatch ? aliasMatch[1] : specifier);
    }
  }

  return names;
}

function normalizeCodegenTypes(code) {
  if (!code.includes("CodegenTypes as CT")) return code;

  const importedNames = getImportedNames(code);
  const usedCodegenTypes = CODEGEN_TYPES.filter((typeName) =>
    new RegExp(`\\bCT\\.${typeName}\\b`).test(code),
  );
  const typesToImport = usedCodegenTypes.filter(
    (typeName) => !importedNames.has(typeName),
  );

  let next = code.replace(
    /import type \{\s*CodegenTypes as CT,\s*([^}]+)\} from 'react-native';/,
    (_match, rest) => {
      const reactNativeImport = rest.trim()
        ? `import type { ${rest.trim()} } from 'react-native';`
        : "";
      const codegenImport = typesToImport.length
        ? `import type { ${typesToImport.join(", ")} } from 'react-native/Libraries/Types/CodegenTypes';`
        : "";

      return [reactNativeImport, codegenImport].filter(Boolean).join("\n");
    },
  );

  for (const typeName of usedCodegenTypes) {
    next = next.replace(new RegExp(`\\bCT\\.${typeName}\\b`, "g"), typeName);
  }

  return next;
}

module.exports = function () {
  return {
    pre(file) {
      const filename = file.opts.filename || "";
      if (!shouldPatch(filename)) return;

      file.code = normalizeCodegenTypes(file.code);
    },
  };
};
