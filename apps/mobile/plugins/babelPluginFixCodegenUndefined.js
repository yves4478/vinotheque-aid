// Fixes "Unknown prop type for X: undefined" from @react-native/babel-plugin-codegen.
// react-native-screens 4.4.x has event handler props in its Fabric NativeComponent
// TypeScript files whose types conditionally resolve to `undefined` depending on
// architecture. The codegen plugin throws on these. We remove them before it runs.
module.exports = function () {
  return {
    visitor: {
      TSPropertySignature(path, state) {
        const filename = state.filename || "";
        if (
          !filename.includes("react-native-screens") ||
          !filename.includes("/fabric/")
        )
          return;

        const annot = path.node.typeAnnotation;
        if (
          annot &&
          annot.typeAnnotation &&
          annot.typeAnnotation.type === "TSUndefinedKeyword"
        ) {
          path.remove();
        }
      },
    },
  };
};
