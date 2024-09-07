[![pages-build-deployment](https://github.com/Edunga1/canvas-floating-alphabet/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/Edunga1/canvas-floating-alphabet/actions/workflows/pages/pages-build-deployment)

Demo: https://edunga1.github.io/canvas-floating-alphabet/

Features:

- Reset the canvas by clicking and holding touch on the canvas.
- Impact effect by touching the canvas. (Enabled by default)

Query Parameters:

- Word. `w`: The word to display. Default: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
- Word Size. `s`: The font size of the word. Default: `5`
- Word Velocity. `v`: The speed of the word. Default: `0.03`
- Delay(tick). `d`: Waits for the tick to start the animation. Default: `120`
- Background Color. `b`: The background color of the canvas. Default is transparent.
    - The color only can be in hex code.
    - Example: `b=FF0000` for red.
    - Demo: https://edunga1.github.io/canvas-floating-alphabet/?b=FF69B4
- Impact Effect. `i`:  `1` to enable, otherwise to disable. Default is enabled.
    - Touch the canvas to cause the impact effect.
    - Impact effect skips the tick delay.
- Cursor Effect. `c`: `1` to enable, `0` to disable. Default is disabled.
    - Cursor effect follows the cursor.
    - This reperesents the impact radius.
