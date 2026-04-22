module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      require("./plugins/babelPluginFixCodegenUndefined"),
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": ".",
          },
        },
      ],
    ],
  };
};
