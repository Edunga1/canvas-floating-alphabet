class Canvas {
  constructor(
    document,
    container,
  ) {
    this.document = document
    this.container = container
    this.canvas = this.#createCanvas()
    this.container.appendChild(this.canvas)
    /** @type {CanvasRenderingContext2D} */
    this.context = this.canvas.getContext("2d")
    this.isTransparent = false
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
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
  }) {
    const color = foreground ?? (this.isTransparent ? "black" : "white")
    this.context.fillStyle = color
    this.context.fillRect(x, y, size, size)
    if (border) {
      this.context.strokeStyle = border
      this.context.strokeRect(x, y, size, size)
    }
  }

  addLine({
    x1,
    y1,
    x2,
    y2,
    color = this.isTransparent ? "black" : "white",
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

  draw(func) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (!this.isTransparent) {
      this.context.fillStyle = "black"
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    this.context.save()
    func(this)
    this.context.restore()
  }

  setTransparentBackground() {
    this.isTransparent = true
  }
}

export default class Vector {
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
    isScoreParticle = false,
  }) {
    this.info = info
    this.pos = pos
    this.radius = radius
    this.velocity = velocity
    this.isScoreParticle = isScoreParticle
  }
  collide(particle) {
    if (!this.#intersects(particle)) return
    const newVelocity = this.#calcVelocity(particle)
    const newParticleVelocity = particle.#calcVelocity(this)
    this.velocity = newVelocity
    particle.velocity = newParticleVelocity
  }
  forward() {
    this.pos = this.#nextPos()
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
    this.cursor = undefined
    this.cursorEnabled = cursorEnabled
    this.cursorColor = "#00ff00"
    this.gameModeEnabled = gameModeEnabled

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
    this.cursor = new Vector(x, y)
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

    this.fragments.forEach(i => {
      this.fragments.forEach(j => {
        if (i === j) return
        i.collide(j)
      })
      // bounce off the wall
      if (i.pos.x - i.radius < 0 || i.pos.x + i.radius > this.canvas.width) {
        i.velocity.x *= -1
      }
      if (i.pos.y - i.radius < 0 || i.pos.y + i.radius > this.canvas.height) {
        i.velocity.y *= -1
      }
      i.forward()
    })
  }

  #render() {
    this.canvas.draw((canvas) => {
      this.#renderCursor(canvas)
      this.#renderFragments(canvas)
    })
  }

  #renderCursor(canvas) {
    if (this.cursor === undefined) return
    if (!this.cursorEnabled) return
    const fragments = this.#getFragmentsInImpactDistance()
    fragments.forEach(i => {
      canvas.addLine({
        x1: i.pos.x,
        y1: i.pos.y,
        x2: this.cursor.x,
        y2: this.cursor.y,
        color: this.cursorColor,
        opacity: 0.7,
      })
    })
  }

  #renderFragments(canvas) {
    const fragementsInImpactDistance = new Set(this.#getFragmentsInImpactDistance())
    this.fragments.forEach(i => {
      const border = this.cursorEnabled && fragementsInImpactDistance.has(i) ? this.cursorColor : undefined
      const foreground = this.gameModeEnabled && i.isScoreParticle ? "red" : undefined
      canvas.addParticle({
        x: i.pos.x,
        y: i.pos.y,
        size: i.radius * 2,
        border,
        foreground,
      })
    })
  }

  #getFragmentsInImpactDistance() {
    if (this.cursor === undefined) return []
    return this.#getFragmentsInRange(this.cursor)
  }

  #getFragmentsInRange(pos) {
    return this.fragments.filter(i => i.pos.subtr(pos).mag() < this.impactedDistance)
  }

  #initWord(word) {
    this.word = word
    const maxCanvasWidth = this.canvas.width * 0.8
    const wordWidth = this.word.length * this.wordSize
    const maxWidth = Math.min(maxCanvasWidth, wordWidth)
    const padding = this.wordSize
    const leftMargin = (this.canvas.width - maxWidth) / 3

    this.fragments = this.word
      .split("")
      .map((letter, seq) => {
        const matrix = this.characterMatrix[letter] ?? []
        return matrix.map((row, y) => {
          return row.map((cell, x) => {
            if (cell !== 1) return undefined
            return new Particle({
              info: letter,
              pos: new Vector(
                leftMargin - maxWidth / 2 + x * padding + seq * this.wordSize * 5,
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

    // Choose one fragment as a score particle for game mode
    this.fragments[Math.random() * this.fragments.length | 0].isScoreParticle = true
  }

  #checkPaused() {
    if (!this.paused) return false
    this.paused = this.ticks < this.delay
    return this.paused
  }
}

async function getCharacterMatrix() {
  return (await fetch("./src/mappings.json")).json()
}

async function main() {
  const params = new URLSearchParams(window.location.search)
  const word = (params.get("w") ?? "ABCDEFGHIJKLMNOPQRSTUVWXYZ").toUpperCase()
  const size = params.get("s") ?? 5
  const isTransparent = params.get("t") === "1"
  const delay = params.get("d") ?? 120
  const velocity = params.get("v") ?? 0.03
  const impactEnabled = (params.get("i") ?? "1") === "1"
  const cursorEnabled = (params.get("c") ?? "1") === "1"
  const gameModeEnabled = (params.get("g") ?? "0") === "1"
  const matrix = await getCharacterMatrix()
  const canvas = new Canvas(document, document.body)

  if (isTransparent) {
    canvas.setTransparentBackground()
  }

  // run app
  const world = new World({
    canvas,
    characterMatrix: matrix,
    wordSize: size,
    delay,
    velocity,
    impactEnabled,
    cursorEnabled,
    gameModeEnabled,
  })

  // on resize
  world.resize(window.innerWidth, window.innerHeight)
  world.run(word)

  window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight)
  })

  window.addEventListener("touchstart", e => {
    world.impact(e.touches[0].clientX, e.touches[0].clientY)
    world.startResetThreshold()
  })
  window.addEventListener("mousedown", e => {
    world.impact(e.clientX, e.clientY)
    world.startResetThreshold()
  })
  window.addEventListener("touchend", e => {
    e.preventDefault()
    world.releaseResetThreshold()
  })
  window.addEventListener("mouseup", () => {
    world.releaseResetThreshold()
  })
  window.addEventListener("mousemove", e => {
    world.moveCursor(e.clientX, e.clientY)
  })
}

main()
