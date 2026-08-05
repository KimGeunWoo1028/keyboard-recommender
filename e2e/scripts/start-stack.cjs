/**
 * Start FastAPI (8000), wait for /health, then Next.js (3000) for Playwright `webServer`.
 * Kills the API child when the Next process exits (local reuse) or on SIGINT/SIGTERM.
 */
const { spawn, spawnSync } = require("child_process");
const http = require("http");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");

function terminateChild(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        shell: false,
      });
      return;
    }
    child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
}

function waitForHealth(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`timeout waiting for ${url}`));
        return;
      }
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(undefined);
          } else {
            setTimeout(ping, 400);
          }
        })
        .on("error", () => setTimeout(ping, 400));
    }
    ping();
  });
}

async function main() {
  if (process.env.CI !== "true") {
    const pip = spawnSync("python", ["-m", "pip", "install", "-q", "-e", ".[dev]"], {
      cwd: backendDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (pip.status !== 0 && pip.status !== null) {
      process.exit(pip.status);
    }
  } else {
    console.log("CI=true: skipping pip install -e (already installed by workflow)");
  }

  const api = spawn(
    "python",
    ["-m", "uvicorn", "keyboard_recommender.main:app", "--app-dir", "src", "--host", "127.0.0.1", "--port", "8000"],
    {
      cwd: backendDir,
      stdio: "inherit",
      env: {
        ...process.env,
        CORS_ORIGINS: "http://127.0.0.1:3000",
        // Account save/mypage bookmarks live in eval_events. Always on for this stack so a
        // parent shell left over from unit QA (ENABLE_EVALUATION_PERSISTENCE=false) cannot
        // silently break critical-flows / save-reliability. Opt out only with
        // E2E_ALLOW_PERSISTENCE_OFF=1 when intentionally testing the disabled path.
        ENABLE_EVALUATION_PERSISTENCE:
          process.env.E2E_ALLOW_PERSISTENCE_OFF === "1"
            ? (process.env.ENABLE_EVALUATION_PERSISTENCE ?? "false")
            : "true",
        // Force local+debug so disposable signup returns debug_code even when the parent
        // shell / backend/.env is deploy-shaped (APP_ENV=production strips debug flags).
        DEBUG: "true",
        APP_ENV: "local",
        APP_ENVIRONMENT: "local",
        ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
      },
      shell: false,
    },
  );

  api.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  await waitForHealth("http://127.0.0.1:8000/health", 120_000);

  // P-P9: default to production Next server. Opt into `next dev` with PW_USE_DEV_SERVER=1.
  const useDevServer = process.env.PW_USE_DEV_SERVER === "1";
  if (!useDevServer) {
    console.log("Building frontend for production E2E (set PW_USE_DEV_SERVER=1 to skip)…");
    const build = spawnSync("npm", ["run", "build"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000",
      },
    });
    if (build.status !== 0 && build.status !== null) {
      terminateChild(api);
      process.exit(build.status);
    }
  }

  const fe = spawn(
    "npm",
    useDevServer
      ? ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"]
      : ["run", "start", "--", "--hostname", "127.0.0.1", "--port", "3000"],
    {
      cwd: frontendDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000",
        PORT: "3000",
      },
      shell: process.platform === "win32",
    },
  );

  fe.on("error", (err) => {
    console.error(err);
    terminateChild(api);
    process.exit(1);
  });

  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    terminateChild(api);
    terminateChild(fe);
  }

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  fe.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
