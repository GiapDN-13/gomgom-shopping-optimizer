import next from "eslint-config-next";

// Next.js 16 ships a native flat config array.
const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      ".claude/**",
      ".claude-flow/**",
    ],
  },
];

export default eslintConfig;
