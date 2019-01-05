const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
const lines : number = 4
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 3
const color : string = "#673AB7"

const maxScale : Function = (scale : number, i : number, n : number) : number => Math.max(0, scale - i / n)
const divideScale : Function = (scale : number, i : number, n : number) : number => Math.min(1/n, maxScale(scale, i, n)) * n
const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)
const mirrorValue : Function = (scale : number, a : number, b : number) : number => {
    const k = 1 - scaleFactor(scale)
    return (1 - k) / a + k / b
}
const updateScale : Function = (scale : number, dir : number, a : number, b : number) => mirrorValue(scale, lines, 1) * dir

const drawCTLNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = h / (nodes + 1)
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.lineCap = 'round'
    context.strokeStyle = color
    context.fillStyle =  color
    const size : number = gap / sizeFactor
    const rSize : number = size * 0.8
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const xGap : number = size / (lines + 1)
    context.save()
    context.translate(w/2, gap * (i + 1))
    context.rotate(Math.PI / 2 * sc2)
    context.fillRect(-rSize, -rSize, rSize, rSize)
    for (var j = 0; j < lines; j++) {
        const sc : number = divideScale(sc1, j, lines)
        context.save()
        context.translate(-size, xGap * (j + 1))
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(2 * size * sc, 0)
        context.stroke()
        context.restore()
    }
    context.restore()
}

class CircleTornbyLineStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#BDBDBD'
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : CircleTornbyLineStage = new CircleTornbyLineStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateScale(this.scale, this.dir, lines, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
          this.animated = true
          this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class CTLNode {
    prev : CTLNode
    next : CTLNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new CTLNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawCTLNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : CTLNode {
        var curr : CTLNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class CircleTornbyLine {
    root : CTLNode = new CTLNode(0)
    curr : CTLNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    ctl : CircleTornbyLine = new CircleTornbyLine()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.ctl.draw(context)
    }

    handleTap(cb : Function) {
        this.ctl.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.ctl.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
