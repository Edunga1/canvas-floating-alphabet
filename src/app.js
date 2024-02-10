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

class Particle {
  constructor({
    info = '',
    pos = { x: 0, y: 0 },
    radius = 20,
    velocity = { x: 0, y: 0 },
  }) {
    this.info = info
    this.pos = pos
    this.radius = radius
    this.radius = radius
    this.velocity = velocity
  }
  collide(particle) {
    if (!this.#intersects(particle)) return
    const dx = this.pos.x - particle.pos.x
    const dy = this.pos.y - particle.pos.y
    const angle = Math.atan2(dy, dx)
    const targetX = this.pos.x + Math.cos(angle)
    const targetY = this.pos.y + Math.sin(angle)
    const ax = targetX - particle.pos.x
    const ay = targetY - particle.pos.y
    particle.pos.x += ax
    particle.pos.y += ay
    this.pos.x -= ax
    this.pos.y -= ay
  }
  forward() {
    this.pos.x += this.velocity.x
    this.pos.y += this.velocity.y
  }
  #intersects(particle) {
    const mag = Math.sqrt(
      Math.pow(this.pos.x - particle.pos.x, 2) +
      Math.pow(this.pos.y - particle.pos.y, 2)
    )
    return this.radius + particle.radius >= mag
  }
}

class World {
  constructor(
    canvas,
    characterMatrix,
    wordSize = 20,
    delay = 120,
  ) {
    this.delay = delay
    this.velocityRange = 1
    this.canvas = canvas

    /** @type {Object<string, number[][]>} */
    this.characterMatrix = characterMatrix
    this.word = ''
    this.wordSize = wordSize

    /** @type {Particle[]} */
    this.fragments = []
  }

  run(word = 'unknown') {
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

  #update() {
    if (this.delay > 0) {
      this.delay--
      return
    }

    const opponents = this.fragments
    this.fragments.forEach(i => {
      opponents.forEach(j => {
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
      .split('')
      .map((letter, seq) => {
        const matrix = this.characterMatrix[letter] ?? []
        return matrix.map((row, y) => {
          return row.map((cell, x) => {
            if (cell !== 1) return undefined
            return new Particle({
              info: letter,
              pos: {
                x: leftMargin - maxWidth / 2 + x * padding + seq * this.wordSize * 5,
                y: this.canvas.height / 2 + y * padding,
              },
              radius: this.wordSize / 2,
              velocity: {
                x: Math.random() * this.velocityRange - this.velocityRange / 2,
                y: Math.random() * this.velocityRange - this.velocityRange / 2,
              },
            })
          })
            .filter(i => i !== undefined)
        })
          .flat()
      })
      .flat()
  }
}

async function getCharacterMatrix() {
  return (await fetch('./src/mappings.json')).json()
}

async function main() {
  const params = new URLSearchParams(window.location.search)
  const word = params.get("w") ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const size = params.get("s") ?? 5
  const isTransparent = params.get("t") === '1'
  const delay = params.get("d") ?? 120
  const matrix = await getCharacterMatrix()
  const canvas = new Canvas(
    document,
    document.body,
  )

  if (isTransparent) {
    canvas.setTransparentBackground()
  }

  // run app
  const world = new World(
    canvas,
    matrix,
    size,
    delay,
  )

  // on resize
  world.resize(window.innerWidth, window.innerHeight)
  world.run(word)

  window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight)
  })
}

main()
