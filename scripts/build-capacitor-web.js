const fs = require("fs");
const path = require("path");

const root = process.cwd();
const output = path.join(root, "www");

const ignoredNames = new Set([
  ".git",
  ".firebase",
  "android",
  "backups",
  "functions",
  "node_modules",
  "scripts",
  "www"
]);

const ignoredFiles = new Set([
  ".firebaserc",
  ".gitignore",
  "capacitor.config.json",
  "firebase-debug.log",
  "firebase.json",
  "firestore.rules",
  "package-lock.json",
  "package.json"
]);

const allowedExtensions = new Set([
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".png",
  ".svg",
  ".txt",
  ".webmanifest",
  ".webp",
  ".woff",
  ".woff2"
]);

function shouldCopy(sourcePath, name) {
  if (ignoredNames.has(name) || ignoredFiles.has(name)) {
    return false;
  }

  const stat = fs.statSync(sourcePath);

  if (stat.isDirectory()) {
    return true;
  }

  return allowedExtensions.has(
    path.extname(name).toLowerCase()
  );
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir)) {
    const sourcePath = path.join(sourceDir, entry);

    if (!shouldCopy(sourcePath, entry)) {
      continue;
    }

    const targetPath = path.join(targetDir, entry);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

fs.rmSync(output, {
  recursive: true,
  force: true
});

copyDirectory(root, output);

const indexPath = path.join(output, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error(
    "No se generó www/index.html."
  );
}

let index = fs.readFileSync(
  indexPath,
  "utf8"
);

index = index.replace(
  /<link\s+rel="manifest"[^>]*>\s*/i,
  ""
);

index = index.replace(
  /<link\s+rel="dns-prefetch"\s+href="\/\/wa\.me"\s*>\s*/i,
  '<link rel="dns-prefetch" href="https://wa.me">\n'
);

index = index.replace(
  /navigator\.serviceWorker\.register\([^;]+;?/g,
  ""
);

fs.writeFileSync(
  indexPath,
  index,
  "utf8"
);

const swPath = path.join(output, "sw.js");

if (fs.existsSync(swPath)) {
  fs.rmSync(swPath);
}

console.log(
  "OK: Recursos web preparados en www/."
);
