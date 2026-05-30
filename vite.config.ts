import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function normalizeBasePath(basePath: string) {
  if (basePath === "./" || basePath === ".") return "./";

  const trimmed = basePath.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function githubPagesBasePath() {
  const explicitBase = process.env.VITE_BASE_PATH || process.env.BASE_PATH;
  if (explicitBase) return normalizeBasePath(explicitBase);

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").filter(Boolean).pop() || "cam-governance-catalogue";
  return normalizeBasePath(repositoryName);
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? githubPagesBasePath() : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "docs",
    // Keep GitHub Pages static assets that intentionally live directly under docs/.
    emptyOutDir: false,
  },
}));
