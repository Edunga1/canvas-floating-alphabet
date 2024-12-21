[![pages-build-deployment](https://github.com/Edunga1/canvas-floating-alphabet/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/Edunga1/canvas-floating-alphabet/actions/workflows/pages/pages-build-deployment)

Demo: https://edunga1.github.io/canvas-floating-alphabet/

Features:

- Reset the canvas by clicking and holding touch on the canvas.
- Impact effect by touching the canvas. (Enabled by default)

Query Parameters:

- Word. `w`: The word to display. Default: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`. examples: [hello world](https://edunga1.github.io/canvas-floating-alphabet?w=hello%20world), [bye 2023 hello 2024](https://edunga1.github.io/canvas-floating-alphabet?w=bye%202023%20hello%202024)
    - Only alphabets are allowed.
- Word Size. `s`: The font size of the word. Default: `5`. examples: [10](https://edunga1.github.io/canvas-floating-alphabet?s=10), [20](https://edunga1.github.io/canvas-floating-alphabet?s=20)
- Word Velocity. `v`: The speed of the word. Default: `0.03`. examples: [0.01](https://edunga1.github.io/canvas-floating-alphabet?v=0.01), [1](https://edunga1.github.io/canvas-floating-alphabet?v=1)
- Delay(tick). `d`: Waits for the tick to start the animation. Default: `120`
- Background Color. `b`: The background color of the canvas. Default is transparent.
    - The color only can be in hex code.
    - Example: `b=FF0000` for red.
    - Demo: https://edunga1.github.io/canvas-floating-alphabet/?b=FF69B4
    - examples: [FF0000(red)](https://edunga1.github.io/canvas-floating-alphabet?b=FF0000), [00FF00(green)](https://edunga1.github.io/canvas-floating-alphabet?b=00FF00), [0000FF(blue)](https://edunga1.github.io/canvas-floating-alphabet?b=0000FF)
- Impact Effect. `i`:  `1` to enable, otherwise to disable. Default is enabled.
    - Touch the canvas to cause the impact effect.
    - Impact effect skips the tick delay.
    - examples: [enable(default)](https://edunga1.github.io/canvas-floating-alphabet), [disable](https://edunga1.github.io/canvas-floating-alphabet?i=0)
- Cursor Effect. `c`: `1` to enable, `0` to disable. Default is enabled.
    - Cursor effect follows the cursor.
    - This reperesents the impact radius.
    - examples: [enable(default)](https://edunga1.github.io/canvas-floating-alphabet?c=1), [disable](https://edunga1.github.io/canvas-floating-alphabet?c=0)
