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

class World {
  constructor(
    canvas,
    characterMatrix,
    wordSize = 20,
  ) {
    this.velocityRange = .03
    this.canvas = canvas

    /** @type {Object<string, number[][]>} */
    this.characterMatrix = characterMatrix
    this.word = ''
    this.wordSize = wordSize

    this.fragments = [
      {
        c: 'dummy(unused)',
        pos: { x: 100, y: 100 },
        w: 20,
        h: 20,
        sz: 20,
        v: { x: 0, y: 0 },
      },
    ]
    this.walls = []
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
    this.walls = [
      { pos: { x: -100, y: -100 }, w: width + 200, h: 100 }, // upper
      { pos: { x: -100, y: height }, w: width + 200, h: 100 }, // lower
      { pos: { x: -100, y: 0 }, w: 100, h: height }, // left
      { pos: { x: width, y: 0 }, w: 100, h: height }, // right
    ]
  }

  #update() {
    const opponents = this.fragments.concat(this.walls)
    this.fragments.forEach(i => {
      opponents.forEach(j => {
        if (i === j) return
        if (
          i.pos.x < j.pos.x + j.w &&
          i.pos.x + i.w > j.pos.x &&
          i.pos.y < j.pos.y + j.h &&
          i.pos.y + i.h > j.pos.y
        ) {
          i.v.x *= -1
          i.v.y *= -1
        }
      })
      i.pos.x += i.v.x
      i.pos.y += i.v.y
    })
  }

  #render() {
    this.canvas.draw((canvas) => {
      this.fragments.forEach(i => canvas.addParticle(i.pos.x, i.pos.y, i.sz))
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
            return {
              c: letter,
              pos: {
                x: leftMargin - maxWidth / 2 + x * padding + seq * this.wordSize * 5,
                y: this.canvas.height / 2 + y * padding,
              },
              w: this.wordSize / 2,
              h: this.wordSize / 2,
              sz: this.wordSize,
              v: {
                x: Math.random() * this.velocityRange - this.velocityRange / 2,
                y: Math.random() * this.velocityRange - this.velocityRange / 2,
              },
            }
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
  const size = params.get("s") ?? 20
  const isTransparent = params.get("t") === '1'
  const matrix = await getCharacterMatrix()
  const canvas = new Canvas(
    document,
    document.body,
  )

  if (isTransparent) {
    canvas.setTransparentBackground()
  }

  // run app
  const world = new World(canvas, matrix, size)

  // on resize
  window.addEventListener("load", () => {
    world.resize(window.innerWidth, window.innerHeight)
    world.run(word)
  })
  window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight)
  })
}

main()
