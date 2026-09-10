import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// vite-plugin-svgr v5 + @svgr/core v9 no longer emit the legacy
// `ReactComponent` named export by default, but the template imports
// icons as `import { ReactComponent as X } from "./x.svg?react"`.
// Restore the named export explicitly via a custom template.
const svgrTemplate = (variables: any, { tpl }: any) => tpl`
${variables.imports};

${variables.interfaces};

const ${variables.componentName} = (${variables.props}) => (
  ${variables.jsx}
);

export { ${variables.componentName} as ReactComponent };
export default ${variables.componentName};
`;

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr({ svgrOptions: { template: svgrTemplate } })],
  server: {
    port: 5173,
  },
});
