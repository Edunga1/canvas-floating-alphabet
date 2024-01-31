class Canvas {
  constructor(
    document,
    container,
    width,
    height,
  ) {
    this.document = document
    this.container = container
    this.canvas = this.#createCanvas(width, height)
    this.container.appendChild(this.canvas)
    /** @type {CanvasRenderingContext2D} */
    this.context = this.canvas.getContext("2d")
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  #createCanvas(width, height) {
    const canvas = this.document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas
  }

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
  }

  addText(text, x, y, size = 20) {
    this.context.fillStyle = "white"
    this.context.font = `${size}px Arial`
    this.context.fillText(text, x, y)
  }

  draw(func) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.fillStyle = "black"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.save()
    func(this)
    this.context.restore()
  }
}

class World {
  constructor(canvas) {
    this.velocityRange = 0.1
    this.canvas = canvas

    this.word = ''
    this.wordSize = 20

    this.entities = [
      {
        c: '!',
        x: 100,
        y: 100,
        size: 20,
        velocity: {x: 0, y: 0},
      },
    ]
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

  #update() {
    this.entities.forEach(i => {
      i.x += i.velocity.x
      i.y += i.velocity.y
    })
  }

  #render() {
    this.canvas.draw((canvas) => {
      this.entities.forEach(i => {
        canvas.addText(i.c, i.x, i.y, i.size)
      })
    })
  }

  #initWord(word) {
    this.word = word
    const maxCanvasWidth = this.canvas.width * 0.8
    const wordWidth = this.word.length * this.wordSize
    const maxWidth = Math.min(maxCanvasWidth, wordWidth)
    const padding = maxWidth / this.word.length

    this.entities = this.word.split('').map((c, i) => ({
      c: c,
      x: this.canvas.width / 2 - maxWidth / 2 + i * padding,
      y: this.canvas.height / 2,
      s: this.wordSize,
      velocity: {
        x: Math.random() * this.velocityRange - this.velocityRange / 2,
        y: Math.random() * this.velocityRange - this.velocityRange / 2,
      },
    }))
  }
}

function main() {
  const word = new URLSearchParams(window.location.search).get("w") ?? 'HELLO,WORLD!'
  const canvas = new Canvas(
    document,
    document.body,
    window.innerWidth,
    window.innerHeight,
  )

  // run app
  new World(canvas).run(word)

  // on resize
  window.addEventListener("resize", () => {
    canvas.resize(window.innerWidth, window.innerHeight)
  })
}

main()
