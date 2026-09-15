# signal-well

Static WebGPU scene — **upload this folder to GitHub Pages and it runs**. No build step.

TSL oil floor, volume glass lens, compute sparks, bloom. `three@0.186.0`.

## Deploy (GitHub Pages)

1. Create a repo. Push **this whole directory** (`index.html`, `src/`, `public/`, `.nojekyll`).
2. Settings → Pages → Deploy from **branch** → `main` / **root**.
   Do **not** set the source to `/docs` (that folder is notes, not the site).
3. Open the site URL in current Chromium / Edge / Safari (WebGPU).

`.nojekyll` stops Jekyll from hiding `src/`.

### Why it works without npm

| Need | Source |
|------|--------|
| three r186 WebGPU | jsDelivr `three@0.186.0/build/three.webgpu.js` |
| TSL | `three@0.186.0/build/three.tsl.js` |
| addons | `three@0.186.0/examples/jsm/` |
| App modules | relative `./src/**/*.js` |
| HDRI | relative `./public/hdr/env.hdr` (via `import.meta.url`) |

Import map is pinned. Do not float `@latest`.

Works on user site (`https://user.github.io/`) and project site (`https://user.github.io/repo/`). No leading `/` on local paths.

## Local preview

```bash
python3 -m http.server 4173
# or: npx --yes serve -p 4173 .
```

Open `http://localhost:4173/` — `file://` breaks the import map.

- `?debug=1` — FPS + lil-gui
- `?proof=1` — skip sparks / bloom / shadows

Drag to orbit (auto-rotates until the first pointer). Touch: one-finger orbit, pinch dolly.

## Stack lock

- `three@0.186.0` only
- Glass = `MeshPhysicalMaterial` transmission 1, opacity 1, attenuation (not opacity-as-glass)
- Sparks = TSL compute, 4096, one attractor on the lens
- Bloom = `RenderPipeline` + `pass` + `bloom`; loop calls `pipeline.render()`

## CREDITS

- `public/hdr/env.hdr` — Poly Haven *Moonless Golf* 1k, CC0 (Greg Zaal), via three.js r186 `examples/textures/equirectangular/moonless_golf_1k.hdr`
- three.js r186 (MIT)
