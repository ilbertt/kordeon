// Asset imports resolve to their served URL through Remotion's webpack (asset
// modules), the same way Vite treats them in the website.
declare module '*.svg' {
  const src: string;
  export default src;
}
