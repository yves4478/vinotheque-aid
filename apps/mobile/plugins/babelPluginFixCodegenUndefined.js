// The @react-native/babel-plugin-codegen detects files to process by looking for
// `import codegenNativeComponent from '...'`. It then tries to resolve TypeScript
// prop types, but react-native-screens 4.4.x fabric files have event handler types
// that resolve to JS `undefined` at codegen runtime → throws "Unknown prop type".
//
// Fix: replace the static import with a require() call in these files only.
// The codegen plugin won't detect it (it only scans import declarations), so it
// skips the file entirely. Runtime behaviour is identical — require().default
// returns the same function.
module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const filename = state.filename || "";
        if (
          !filename.includes("react-native-screens") ||
          !filename.includes("/fabric/")
        )
          return;

        const source = path.node.source.value;
        if (!source.includes("codegenNativeComponent")) return;

        const specifier = path.node.specifiers.find((s) =>
          t.isImportDefaultSpecifier(s),
        );
        if (!specifier) return;

        // import codegenNativeComponent from '...'
        // → const codegenNativeComponent = require('...').default
        path.replaceWith(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(specifier.local.name),
              t.memberExpression(
                t.callExpression(t.identifier("require"), [
                  t.stringLiteral(source),
                ]),
                t.identifier("default"),
              ),
            ),
          ]),
        );
      },
    },
  };
};
