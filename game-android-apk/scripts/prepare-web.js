import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const source = resolve(root, "docs");
const target = resolve(process.cwd(), "www");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

// Android-only layout safety: allow compact screens to scroll instead of
// clipping menu content, while keeping the actual match canvas full-screen.
const cssPath = resolve(target, "css/style.css");
const css = await readFile(cssPath, "utf8");
await writeFile(cssPath, css + `

/* Android APK viewport and small-landscape overflow fixes */
html, body { width:100%; min-width:0; min-height:100%; }
.scr:not(#game) {
  min-height:100dvh;
  height:100dvh;
  max-height:none;
  overflow-x:hidden;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding-top:max(8px, env(safe-area-inset-top));
  padding-right:max(8px, env(safe-area-inset-right));
  padding-bottom:max(8px, env(safe-area-inset-bottom));
  padding-left:max(8px, env(safe-area-inset-left));
}
.scr:not(#game) > * { flex-shrink:0; }
#home .home-grid { flex:1 0 auto; min-height:0; }
#home .home-left, #home .home-stage { min-height:0; }
#game { position:fixed; inset:0; width:100vw; height:100dvh; overflow:hidden; }
#game #c { width:100vw; height:100dvh; max-width:none; max-height:none; object-fit:fill; }
@media (orientation:landscape) and (max-height:600px) {
  .scr:not(#game) { gap:6px; padding:7px; }
  .home-header { min-height:36px; padding-bottom:5px; }
  .home-brand>img { height:28px; }
  .home-tools .btn { min-height:30px; padding:4px 7px; font-size:9px; }
  .home-grid { gap:7px; }
  .home-left, .home-stage { padding:8px; gap:6px; }
  .home-heading h1 { font-size:clamp(14px,2.3vw,20px); }
  .home-call input { min-height:36px; padding:6px 9px; }
  .level-card { padding:7px 9px; }
  .home-actions .btn { min-height:38px; padding:7px; }
  .home-subnav .btn { min-height:30px; padding:5px 3px; }
  .hero-box { min-height:65px; }
  .quick-chars button img { height:22px; }
}
`);
console.log("Prepared game web assets with Android viewport fixes.");
