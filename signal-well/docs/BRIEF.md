# signal-well brief

Proof that r186 deep-distill is usable without re-reading HTML.

Compose, do not clone `rose` (no petals, no rain, no wet maps).

Contracts borrowed:
- `webgpu_tsl_raging_sea` — TSL elevation + neighbor normals
- `webgpu_materials_transmission` — physical transmission + IBL, thickness set (demo left it at 0 until GUI)
- `webgpu_postprocessing_bloom` — `RenderPipeline` + add bloom, never `renderer.render` while post is on
- `webgpu_tsl_compute_attractors_particles` — storage + `toAttribute` + `await renderer.init` before compute; count cut to 4096
- house glass law — volume path, not opacity hacks

Done when HTTP 200 on index/src/hdr and a WebGPU browser shows oil + lens + sparks.
