class Canvas {
  constructor(
    document,
    container,
    backgroundColor,
  ) {
    this.document = document
    this.container = container
    this.canvas = this.#createCanvas()
    this.container.appendChild(this.canvas)
    /** @type {CanvasRenderingContext2D} */
    this.context = this.canvas.getContext("2d")
    this.backgroundColor = this.#parseColor(backgroundColor)
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  #parseColor(color) {
    if (color === undefined) return undefined
    return `#${color}`
  }

  #createCanvas() {
    const canvas = this.document.createElement("canvas")
    return canvas
  }

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
  }

  addParticle({
    x,
    y,
    size = 20,
    border = undefined,
    foreground = undefined,
    opacity = 1,
  }) {
    const color = foreground ?? (this.backgroundColor ? "white" : "black")
    this.context.save()
    this.context.fillStyle = color
    this.context.globalAlpha = opacity
    this.context.fillRect(x, y, size, size)
    if (border) {
      this.context.strokeStyle = border
      this.context.strokeRect(x, y, size, size)
    }
    this.context.restore()
  }

  addLine({
    x1,
    y1,
    x2,
    y2,
    color = this.backgroundColor ? "white" : "black",
    opacity = 1,
  }) {
    this.context.save()
    this.context.strokeStyle = color
    this.context.globalAlpha = opacity
    this.context.beginPath()
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
    this.context.closePath()
    this.context.restore()
  }

  addBackgroundText(text) {
    const size = Math.min(this.canvas.width, this.canvas.height) / 2
    const x = this.canvas.width / 2
    const y = this.canvas.height / 2 + size / 4
    this.context.save()
    this.context.globalAlpha = 0.2
    this.context.font = `${size}px Arial`
    this.context.textAlign = "center"
    this.context.fillStyle = this.backgroundColor ? "white" : "black"
    this.context.fillText(text, x, y)
    this.context.restore()
  }

  draw(func) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.backgroundColor !== undefined) {
      this.context.fillStyle = this.backgroundColor
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    this.context.save()
    func(this)
    this.context.restore()
  }
}

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y)
  }

  subtr(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y)
  }

  mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  unit() {
    const mag = this.mag()
    if (mag === 0) {
      return new Vector(0, 0)
    }
    return new Vector(this.x / mag, this.y / mag)
  }

  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y
  }
}

class Particle {
  constructor({
    info = "",
    pos = new Vector(),
    radius = 20,
    velocity = new Vector(),
    tailLength = 3,
    tailThreshold = 1,  // adds tail every N steps
  }) {
    this.info = info
    this.pos = pos
    this.prevPos = []
    this.radius = radius
    this.velocity = velocity
    this.tailLength = tailLength
    this.tailThreshold = tailThreshold
    this.tailThresholdCounter = 0
  }
  collide(particle) {
    if (!this.#intersects(particle)) return false
    const newVelocity = this.#calcVelocity(particle)
    const newParticleVelocity = particle.#calcVelocity(this)
    this.velocity = newVelocity
    particle.velocity = newParticleVelocity
    return true
  }
  forward() {
    this.pos = this.#nextPos()
    if (this.tailThresholdCounter++ % this.tailThreshold === 0) {
      this.prevPos.unshift(this.pos)
      this.prevPos = this.prevPos.slice(0, this.tailLength)
    }
  }
  #nextPos() {
    return this.pos.add(this.velocity)
  }
  #intersects(particle) {
    const pos = this.#nextPos()
    return this.radius + particle.radius >= pos.subtr(particle.pos).mag()
  }
  #calcVelocity(particle) {
    return this.velocity.subtr(
      this.pos.subtr(particle.pos)
        .unit()
        .multiply(
          this.velocity.subtr(particle.velocity)
            .dot(this.pos.subtr(particle.pos).unit())
        )
    )
  }
}

class GameMode {
  constructor(enabled) {
    this.enabled = enabled
    this.ids = new Set()
    this.score = 0
  }

  addScoreParticle(id) {
    this.ids.add(id)
  }

  increaseScore() {
    this.score++
  }

  isScoreParticle(idx) {
    if (!this.enabled) return false
    return this.ids.has(idx)
  }
}

class Cursor {
  constructor(enabled, color) {
    this.enabled = enabled
    this.color = color
    this.pos = undefined
  }

  setPos(x, y) {
    this.pos = new Vector(x, y)
  }

  getPos() {
    if (!this.enabled) return undefined
    return this.pos
  }

  clear() {
    this.pos = undefined
  }
}

class World {
  constructor({
    canvas,
    characterMatrix,
    wordSize = 20,
    delay = 120,
    velocityRange = .03,
    impactEnabled = false,
    cursorEnabled = true,
    gameModeEnabled = false,
  }) {
    this.ticks = 0
    this.ticksResetThreshold = undefined
    this.delay = delay
    this.paused = delay > 0
    this.velocityRange = velocityRange
    this.canvas = canvas
    this.impactEnabled = impactEnabled
    this.impactedDistance = wordSize * 4
    this.cursor = new Cursor(cursorEnabled, "#00ff00")
    this.gameMode = new GameMode(gameModeEnabled)

    /** @type {Object<string, number[][]>} */
    this.characterMatrix = characterMatrix
    this.word = ""
    this.wordSize = wordSize

    /** @type {Particle[]} */
    this.fragments = []
  }

  run(word = "unknown") {
    const that = this
    this.#initWord(word)

    requestAnimationFrame(function tick() {
      that.#update()
      that.#render()
      requestAnimationFrame(tick)
    })
  }

  resize(width, height) {
    const ratioX = width / this.canvas.width
    const ratioY = height / this.canvas.height
    this.canvas.resize(window.innerWidth, window.innerHeight)
    this.fragments.forEach(i => {
      i.pos.x = i.pos.x * ratioX
      i.pos.y = i.pos.y * ratioY
    })
  }

  impact(x, y) {
    if (!this.impactEnabled) return
    const impacted = new Vector(x, y)
    this.#getFragmentsInRange(impacted)
      .forEach(i => {
        i.velocity = i.pos.subtr(impacted).multiply(0.1)
      })
    this.paused = false
  }

  startResetThreshold() {
    this.ticksResetThreshold = this.ticks + 60
  }

  releaseResetThreshold() {
    this.ticksResetThreshold = undefined
  }

  moveCursor(x, y) {
    this.cursor.setPos(x, y)
  }

  clearCursor() {
    this.cursor.clear()
  }

  #resetIfOverThreshold() {
    if (this.ticksResetThreshold === undefined) return
    if (this.ticks > this.ticksResetThreshold) {
      this.#reset()
    }
  }

  #reset() {
    this.ticks = 0
    this.ticksResetThreshold = undefined
    this.paused = this.delay > 0
    this.#initWord(this.word)
  }

  #update() {
    this.ticks++
    this.#resetIfOverThreshold()

    if (this.#checkPaused()) return

    for (let i = 0; i < this.fragments.length; i++) {
      const a = this.fragments[i]
      for (let j = i + 1; j < this.fragments.length; j++) {
        const b = this.fragments[j]
        const collided = a.collide(b)
        if (collided && (this.gameMode.isScoreParticle(i) || this.gameMode.isScoreParticle(j))) {
          this.gameMode.increaseScore()
        }
      }
      // bounce off the wall
      if (a.pos.x - a.radius < 0 || a.pos.x + a.radius > this.canvas.width) {
        a.velocity.x *= -1
      }
      if (a.pos.y - a.radius < 0 || a.pos.y + a.radius > this.canvas.height) {
        a.velocity.y *= -1
      }
      a.forward()
    }
  }

  #render() {
    this.canvas.draw((canvas) => {
      this.#renderCursor(canvas)
      this.#renderFragments(canvas)
      this.#renderScore(canvas)
    })
  }

  #renderCursor(canvas) {
    const pos = this.cursor.getPos()
    if (pos === undefined) return
    const fragments = this.#getFragmentsInImpactDistance()
    fragments.forEach(i => {
      canvas.addLine({
        x1: i.pos.x,
        y1: i.pos.y,
        x2: pos.x,
        y2: pos.y,
        color: this.cursor.color,
        opacity: 0.7,
      })
    })
  }

  #renderFragments(canvas) {
    const fragementsInImpactDistance = new Set(this.#getFragmentsInImpactDistance())
    this.fragments.forEach((i, idx) => {
      const border = this.cursor.enabled && fragementsInImpactDistance.has(i) ? this.cursor.color : undefined
      const isScoreParticle = this.gameMode.isScoreParticle(idx)
      const foreground = this.gameMode.enabled && isScoreParticle ? "red" : undefined
      const size = i.radius * 2
      canvas.addParticle({
        x: i.pos.x - size * 0.5,
        y: i.pos.y - size * 0.5,
        size,
        border,
        foreground,
      })
      i.prevPos.forEach((pos, idx) => {
        if (idx === 0) return
        const multiplier = 0.9 ** (idx + 1)
        const psize = size * 0.9 ** multiplier
        canvas.addParticle({
          x: pos.x - psize * 0.5,
          y: pos.y - psize * 0.5,
          size: psize,
          foreground,
          opacity: 0.1,
        })
      })
    })
  }

  #renderScore(canvas) {
    if (!this.gameMode.enabled || this.gameMode.score === 0) return
    canvas.addBackgroundText(this.gameMode.score)
  }

  #getFragmentsInImpactDistance() {
    const pos = this.cursor.getPos()
    if (pos === undefined) return []
    return this.#getFragmentsInRange(pos)
  }

  #getFragmentsInRange(pos) {
    return this.fragments.filter(i => i.pos.subtr(pos).mag() < this.impactedDistance)
  }

  #initWord(word) {
    this.word = word

    this.fragments = this.#wordToFragments(this.word)

    // Choose one fragment as a score particle for game mode
    const scoreParticleIdx = Math.floor(Math.random() * this.fragments.length)
    this.gameMode.addScoreParticle(scoreParticleIdx)
  }

  #checkPaused() {
    if (!this.paused) return false
    this.paused = this.ticks < this.delay
    return this.paused
  }

  #wordToFragments(word) {
    const maxCanvasWidth = this.canvas.width * 0.8
    const wordWidth = this.word.length * this.wordSize
    const maxWidth = Math.min(maxCanvasWidth, wordWidth)
    const padding = this.wordSize
    const leftMargin = (this.canvas.width - maxWidth) / 3
    const letterWidth = this.characterMatrix["A"][0].length
    return word
      .split("")
      .map((letter, seq) => {
        const matrix = this.characterMatrix[letter] ?? []
        return matrix.map((row, y) => {
          return row.map((cell, x) => {
            if (cell !== 1) return undefined
            return new Particle({
              info: letter,
              pos: new Vector(
                leftMargin - maxWidth / 2 + x * padding + seq * this.wordSize * letterWidth,
                this.canvas.height / 2 + y * padding,
              ),
              radius: this.wordSize / 2,
              velocity: new Vector(
                Math.random() * this.velocityRange - this.velocityRange / 2,
                Math.random() * this.velocityRange - this.velocityRange / 2,
              ),
            })
          })
            .filter(i => i !== undefined)
        })
          .flat()
      })
      .flat()
  }
}

async function getCharacterMatrix(glyph) {
  const defaultGlyph = "./src/mappings.json"
  const glyphs = {
    "5x5": "./src/mappings.json",
    "8x8": "./src/mappings-8x8.json",
  }
  const url = glyphs[glyph] ?? defaultGlyph
  return (await fetch(url)).json()
}

function registerEventListeners(world, canvas) {
  const dragThreshold = 5;
  let mouseStartPos = null;

  function onClickStart(x, y) {
    world.impact(x, y)
    world.startResetThreshold()
    mouseStartPos = { x, y }
  }

  function onClickEnd() {
    world.releaseResetThreshold()
    mouseStartPos = null
  }

  function onCurosrMove(x, y) {
    world.moveCursor(x, y)
    if (mouseStartPos != null) {
      const dx = Math.abs(x - mouseStartPos.x)
      const dy = Math.abs(y - mouseStartPos.y)

      if (dx > dragThreshold || dy > dragThreshold) {
        world.impact(x, y)
        world.releaseResetThreshold()
      }
    }
  }

  window.addEventListener("touchstart", (e) => {
    onClickStart(e.touches[0].clientX, e.touches[0].clientY)
  })
  window.addEventListener("mousedown", (e) => {
    onClickStart(e.clientX, e.clientY)
  })
  window.addEventListener("touchend", (e) => {
    e.preventDefault()
    world.clearCursor()
    onClickEnd()
  })
  window.addEventListener("mouseup", () => {
    onClickEnd()
  })
  window.addEventListener("mousemove", (e) => {
    onCurosrMove(e.clientX, e.clientY)
  })
  window.addEventListener("touchmove", (e) => {
    onCurosrMove(e.touches[0].clientX, e.touches[0].clientY)
  })
  canvas.addEventListener("mouseleave", () => {
    world.clearCursor()
  })
}

async function main() {
  const params = new URLSearchParams(window.location.search)
  const word = (params.get("w") ?? "ABCDEFGHIJKLMNOPQRSTUVWXYZ").toUpperCase()
  const size = params.get("s") ?? 5
  const backgroundColor = params.get("b") ?? undefined
  const delay = params.get("d") ?? 120
  const velocity = params.get("v") ?? 0.03
  const impactEnabled = (params.get("i") ?? "1") === "1"
  const cursorEnabled = (params.get("c") ?? "1") === "1"
  const gameModeEnabled = (params.get("g") ?? "0") === "1"
  const glyph = params.get("h") ?? "5x5"
  const matrix = await getCharacterMatrix(glyph)
  const canvas = new Canvas(document, document.body, backgroundColor)

  // run app
  const world = new World({
    canvas,
    characterMatrix: matrix,
    wordSize: size,
    delay,
    velocityRange: Number(velocity),
    impactEnabled,
    cursorEnabled,
    gameModeEnabled,
  })

  // on resize
  world.resize(window.innerWidth, window.innerHeight)
  world.run(word)
  registerEventListeners(world, canvas.canvas)

  window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight)
  })
}

main()
