import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputFile = join(__dirname, "typed-router.d.ts");
const outputFile = join(__dirname, process.argv[2] ?? "routes.txt");

const fileContent = await readFile(inputFile, "utf-8");
const routeMapMatch = fileContent.match(/export interface RouteNamedMap\s*{([\s\S]*?)^\s*}/m);

if (!routeMapMatch) {
  console.error("RouteNamedMap interface not found.");
  process.exit(1);
}

const routesBlock = routeMapMatch[1];
const routeRegex = /^\s*['"]([^'"]+)['"]:/gm;

let match;
const routes = [];
while ((match = routeRegex.exec(routesBlock)) !== null) {
  const route = match[1].replace(/\./g, "/").replace(/\[([^\]]+)\]/g, "{$1}");
  routes.push(route);
}

await writeFile(outputFile, routes.join("\n"), "utf-8");
console.log(`Extracted ${routes.length} routes to ${outputFile}`);
