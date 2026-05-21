import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import { ChildProcess, spawn } from "child_process";
import { BrowserWindow } from "electron";
import { collectAllScreens } from "./fileSystem";

let viteProcess: ChildProcess | null = null;
let previewPort: number | null = null;
let currentProjectPath: string | null = null;

export function getPreviewPort(): number | null {
  return previewPort;
}

async function findFreePort(start = 5200): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(findFreePort(start + 1)));
    server.listen(start, () => {
      server.close(() => resolve(start));
    });
  });
}

function getPreviewDir(projectPath: string): string {
  return path.join(projectPath, ".prototoy", "preview");
}

function writePreviewScaffold(
  previewDir: string,
  projectPath: string,
  port: number,
): void {
  fs.mkdirSync(path.join(previewDir, "src"), { recursive: true });

  const packageJson = {
    name: "prototoy-preview",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: { dev: "vite" },
    dependencies: { react: "^18.3.0", "react-dom": "^18.3.0" },
    devDependencies: {
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.0",
      vite: "^5.3.0",
    },
  };

  const pkgPath = path.join(previewDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));
  }

  const includePath = path.join(projectPath, "_include").replace(/\\/g, "/");
  fs.writeFileSync(
    path.join(previewDir, "vite.config.ts"),
    `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport { resolve } from 'path'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: ${port},\n    strictPort: true,\n    fs: { allow: ['${includePath}', '.'] },\n    middlewareMode: false,\n    historyApiFallback: true\n  },\n  preview: {\n    port: ${port}\n  },\n  resolve: {\n    alias: { '@include': '${includePath}' },\n    extensions: ['.tsx', '.ts', '.jsx', '.js']\n  }\n})\n`,
  );

  fs.writeFileSync(
    path.join(previewDir, "index.html"),
    `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Prototoy Preview</title>\n  <style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`,
  );

  fs.writeFileSync(
    path.join(previewDir, "src", "main.tsx"),
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />)\n`,
  );

  writePreviewApp(previewDir, projectPath);
}

export function writePreviewApp(previewDir: string, projectPath: string): void {
  const screens = collectAllScreens(projectPath);
  const srcDir = path.join(previewDir, "src");
  const relVars = path.relative(
    srcDir,
    path.join(projectPath, "_include", "variables.css"),
  ).replace(/\\/g, "/");

  if (screens.length === 0) {
    fs.writeFileSync(
      path.join(srcDir, "App.tsx"),
      `import React from 'react'\nexport default function App(): React.ReactElement {\n  return (\n    <div style={{ width: 390, height: 844, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa', fontFamily: 'system-ui', fontSize: 13 }}>\n      No screens yet — create one in the sidebar\n    </div>\n  )\n}\n`,
    );
    return;
  }

  const imports = screens
    .map((s, i) => {
      const rel = path.relative(srcDir, s.fsPath).replace(/\\/g, "/");
      return `import Screen${i} from '${rel}'`;
    })
    .join("\n");

  const routeEntries = screens.map((s, i) => `  '${s.urlPath}': Screen${i}`)
    .join(",\n");

  const content = `import React from 'react'
${imports}
import '${relVars}'

const ROUTES: Record<string, React.ComponentType> = {
${routeEntries}
}

export default function App(): React.ReactElement {
  const screenPath = window.location.pathname
  const Screen = ROUTES[screenPath]

  if (!Screen) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa', fontFamily: 'system-ui', fontSize: 13 }}>
        Select a screen from the sidebar
      </div>
    )
  }

  return <Screen />
}
`;
  fs.writeFileSync(path.join(srcDir, "App.tsx"), content);
}

export function regeneratePreviewApp(): void {
  if (!currentProjectPath) return;
  const previewDir = getPreviewDir(currentProjectPath);
  if (!fs.existsSync(path.join(previewDir, "src"))) return;
  writePreviewApp(previewDir, currentProjectPath);
}

export async function startPreviewServer(
  projectPath: string,
  onStatus: (status: string, port?: number) => void,
): Promise<number> {
  if (viteProcess) {
    stopPreviewServer();
  }

  currentProjectPath = projectPath;
  const previewDir = getPreviewDir(projectPath);
  const port = await findFreePort(5200);
  previewPort = port;

  const needsInstall = !fs.existsSync(path.join(previewDir, "node_modules"));
  writePreviewScaffold(previewDir, projectPath, port);

  if (needsInstall) {
    onStatus("installing");
    await new Promise<void>((resolve, reject) => {
      const install = spawn("npm", ["install"], {
        cwd: previewDir,
        stdio: "pipe",
        shell: true,
      });
      install.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with code ${code}`));
      });
    });
  }

  onStatus("starting");

  return new Promise((resolve, reject) => {
    const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
    viteProcess = spawn(npmBin, ["run", "dev"], {
      cwd: previewDir,
      stdio: "pipe",
      shell: false,
      env: { ...process.env },
    });

    const timeout = setTimeout(
      () => reject(new Error("Vite server timed out")),
      30000,
    );

    viteProcess.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("localhost") && text.includes(String(port))) {
        clearTimeout(timeout);
        onStatus("ready", port);
        resolve(port);
      }
    });

    viteProcess.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("localhost") && text.includes(String(port))) {
        clearTimeout(timeout);
        onStatus("ready", port);
        resolve(port);
      }
    });

    viteProcess.on("close", (code) => {
      viteProcess = null;
      previewPort = null;
    });

    viteProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export function stopPreviewServer(): void {
  if (viteProcess) {
    viteProcess.kill("SIGTERM");
    viteProcess = null;
    previewPort = null;
    currentProjectPath = null;
  }
}
