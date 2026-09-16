# castle-grounds

30s looping WebGPU flyby. Original geometry inspired by a courtyard-and-keep layout — no ripped game files.

- three@0.186.0
- `WebGPURenderer` + ACES + `SkyMesh` + HDR IBL
- Volume glass on the rose window (`transmission` / `thickness` / `ior`)
- TSL moat (Journey sea contract, calmer)
- Bloom via `RenderPipeline` — loop calls `pipeline.render()`

## Preview (cubert)

```
ssh cubert
cd /sd-backup/projects/castle-grounds
python3 -m http.server 8767 --bind 0.0.0.0
```

LAN: <http://192.168.4.18:8767/>

`?orbit=1` takes the stick. `?debug=1` logs boot.

Do not steal rose `:8765` or well `:8766`.
