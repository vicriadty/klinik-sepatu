import svgr from "vite-plugin-svgr";

// vite-plugin-svgr v5 + @svgr/core v9 no longer emit the legacy
// `ReactComponent` named export by default, but the template imports
// icons as `import { ReactComponent as X } from "./x.svg?react"`.
// Keep this instance shared so the dev server, the production build,
// and vitest all transform SVGs identically.
export const svgrReactComponent = () =>
  svgr({
    svgrOptions: {
      template: (variables, { tpl }) => tpl`
${variables.imports};

${variables.interfaces};

const ${variables.componentName} = (${variables.props}) => (
  ${variables.jsx}
);

export { ${variables.componentName} as ReactComponent };
export default ${variables.componentName};
`,
    },
  });
