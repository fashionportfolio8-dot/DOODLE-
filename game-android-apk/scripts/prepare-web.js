import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const source = resolve(root, "docs");
const target = resolve(process.cwd(), "www");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log("Copied the main-branch Doodle Outpost game into the Android web bundle.");
