# railgun-xv (R7, f78000d)

An exploded view of the Quake II railgun, rendered live in the browser with three.js r187: take it apart, charge it, fire it.

## Run
Host this folder as the site root (index.html at the root). It needs HTTP for the ES modules, so open it through a web server or Pages, not file://. GitHub Pages: push this folder to a branch root (or /docs) and enable Pages on it; .nojekyll is included. Chrome or Edge gives WebGPU; other browsers use the WebGL2 fallback. With neither, the page says so.

## Use
Drag to orbit, wheel or pinch to zoom, click or tap a part to select it. Press ? in the viewer for the single-key shortcuts; CONTROLS > VIEW > KEYS turns them off. Sound starts muted and switches on at the first click or key press; M toggles it and the VOLUME slider sets the level. Double-click a slider, or press Delete on it, to reset it.

## Query flags
- ?demo=0 skips the attract demo
- ?bg=graphite|sky|stroggos|space picks the backdrop
- ?off=post turns the post-processing off
- ?cinepx=0.75 lowers the pixel ratio during the attract demo (0.5 to 0.99)
- ?nohud hides the whole interface
- ?k.<slider>=<number> sets a slider's starting value, for example ?k.spread=0.6
- ?explode=0..1 starts partly exploded
- ?sel=<part id> highlights that part in the 3D view at start
- ?tm=aces|agx|neutral picks the tone mapper
- ?webgl=1 forces the WebGL2 renderer
