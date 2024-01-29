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
    this.context = this.canvas.getContext("2d")
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
    this.canvas = canvas
    this.word = ''
  }

  run(word = 'unknown') {
    const that = this
    this.word = word

    requestAnimationFrame(function tick() {
      that.#update()
      that.#render()
      requestAnimationFrame(tick)
    })
  }

  #update() {
    // TODO: update entities
  }

  #render() {
    this.canvas.draw((canvas) => {
      canvas.addText(`${this.word}`, 100, 100)
    })
  }
}

function main() {
  const word = new URLSearchParams(window.location.search).get("w") ?? 'Hello, World!'
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
