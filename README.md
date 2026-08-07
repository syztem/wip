# Three.js Hello World (WebGL) – GitHub Pages Ready

A minimal, working Three.js + WebGL spinning cube template.

**No build step. No npm. Pure static files.**  
Works perfectly on GitHub Pages.

## Live Demo Structure

```
threejs-hello-world/
├── index.html      ← entry point
├── main.js         ← scene + animation
└── README.md
```

## How to host on GitHub Pages

1. Create a new repository on GitHub (e.g. `threejs-hello-world` or `username.github.io`).
2. Upload these three files to the **root** of the repository (or put them in a `/docs` folder).
3. Go to **Settings → Pages**.
4. Under **Source**, select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`   ← or `/docs` if you put the files there
5. Click **Save**.
6. Wait 30–60 seconds. Your site will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
   (or `https://<your-username>.github.io/` if the repo is named `username.github.io`)

## Local testing

Because ES modules + import maps require a server (not `file://`):

```bash
# Option 1 – Python
python -m http.server 8000

# Option 2 – Node (if you have it)
npx serve .

# Option 3 – VS Code Live Server extension
```

Then open `http://localhost:8000`.

## What this demo shows

- Modern Three.js **r185** via CDN + import map
- `WebGLRenderer`
- `PerspectiveCamera`
- `BoxGeometry` + `MeshBasicMaterial`
- Continuous rotation with `renderer.setAnimationLoop`
- Responsive resize handling
- Pixel-ratio aware rendering

## Next steps

You can freely add:

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

(because the import map already maps `three/addons/`)

Enjoy building!
```
