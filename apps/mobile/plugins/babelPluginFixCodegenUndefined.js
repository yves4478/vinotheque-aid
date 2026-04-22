// The @react-native/babel-plugin-codegen scans for `import codegenNativeComponent`
// in its Program.enter visitor. Our fix must also run at Program.enter — using
// ImportDeclaration runs too late (after the codegen plugin has already decided
// to process the file).
//
// We do a nested traversal inside Program.enter to convert the import to require()
// before the codegen plugin's Program.enter sees it.
module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(programPath, state) {
          const filename = state.filename || "";
          if (
            !filename.includes("react-native-screens") ||
            !filename.includes("/fabric/")
          )
            return;

          programPath.traverse({
            ImportDeclaration(path) {
              const source = path.node.source.value;
              if (!source.includes("codegenNativeComponent")) return;

              const specifier = path.node.specifiers.find((s) =>
                t.isImportDefaultSpecifier(s),
              );
              if (!specifier) return;

              // import codegenNativeComponent from '...'
              // → const codegenNativeComponent = require('...').default
              // The codegen plugin only scans `import` declarations — require()
              // calls are invisible to it, so it skips processing this file.
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
          });
        },
      },
    },
  };
};
