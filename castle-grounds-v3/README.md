# castle-grounds extreme

A 120-second flyby montage. No player, no orbit, no share button.
Hollow keep and lofted rose from v2; director, weather, particles, and
time-of-day from the ds cut. three.js r186, vendored.

## Run

    python3 -m http.server 8080

Open http://localhost:8080/ . `file://` will not work.

## Reel (120s loop)

| t | id | beat |
| --- | --- | --- |
| 0 | logo | dawn pull-in, title |
| 8 | approach | path toward the keep |
| 18 | plumber | hero close-up |
| 26 | bridge | moat + chains |
| 36 | rose | transmission glass push-in |
| 44 | nave | door thread, look up |
| 54 | well | interior orbit |
| 62 | ascent | tower / gold pin |
| 72 | storm | weather abuse + lightning |
| 84 | circuit | high orbit |
| 94 | night | fireflies |
| 104 | welcome | return to the path |
| 112 | endcard | score card, loop |

## Query

`?debug=1` fps + shot. `?t=72` start at reel second. `?webgl=1` / `?webgpu=1`. `?bloom=1`. `?mute=1`. `?proof=1` castle only.
