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

  addParticle(x, y, size = 20) {
    const color = this.isTransparent ? "black" : "white"
    this.context.fillStyle = color
    this.context.fillRect(x, y, size, size)
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
  }) {
    this.info = info
    this.pos = pos
    this.radius = radius
    this.radius = radius
    this.velocity = velocity
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
  constructor(
    canvas,
    characterMatrix,
    wordSize = 20,
    delay = 120,
    velocityRange = .03,
    impactEnabled = false,
  ) {
    this.ticks = 0
    this.delay = delay
    this.paused = delay > 0
    this.velocityRange = velocityRange
    this.canvas = canvas
    this.impactEnabled = impactEnabled
    this.impactedDistance = wordSize * 4

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
    this.fragments
      .filter(i => i.pos.subtr(impacted).mag() < this.impactedDistance)
      .forEach(i => {
        i.velocity = i.pos.subtr(impacted).multiply(0.1)
      })
    this.paused = false
  }

  #update() {
    this.ticks++

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
      this.fragments.forEach(i => {
        canvas.addParticle(i.pos.x, i.pos.y, i.radius*2)
      })
    })
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
  const impactEnabled = params.get("i") === "1"
  const matrix = await getCharacterMatrix()
  const canvas = new Canvas(document, document.body)

  if (isTransparent) {
    canvas.setTransparentBackground()
  }

  // run app
  const world = new World(
    canvas,
    matrix,
    size,
    delay,
    velocity,
    impactEnabled,
  )

  // on resize
  world.resize(window.innerWidth, window.innerHeight)
  world.run(word)

  window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight)
  })

  window.addEventListener("touchstart", e => {
    world.impact(e.touches[0].clientX, e.touches[0].clientY)
  })
  window.addEventListener("click", e => {
    world.impact(e.clientX, e.clientY)
  })
}

main()
