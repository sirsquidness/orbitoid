console.log("hello")
var target = document.getElementById("galaxy") as HTMLCanvasElement
target.height = window.innerHeight
target.width = window.innerWidth
var ctx  = target.getContext("2d")

const imgSize = 40
const bounceTime = 3000;

// cache the time so we only need one per frame
var currentTicket = new Date().getTime();

class Thing {
    
    Colour: string

    constructor(color: string) {
        this.Colour = color
    }
    Draw(x: number, y: number, t: CanvasRenderingContext2D, m: Array<Modifiers>): void {
        ctx.fillStyle = this.Colour
        ctx.fillRect(x, y,20,20)
    }
}
class Img {
    Source: HTMLImageElement
    Scale: number = 1
    constructor(url: string, scale: number = 1) {
        var i = new Image()
        i.onload = () => {
            this.Source = i
        }
        i.src = url
        this.Scale = scale
    }
    Draw(x: number, y: number, t: CanvasRenderingContext2D,  m: Array<Modifiers>): void {
        if (this.Source) {
            ctx.save()
            ctx.translate(x, y)
            m.forEach((m) => {
                m.Modify(ctx)
            })
            ctx.drawImage(this.Source, (-imgSize/2)*this.Scale, (-imgSize/2)*this.Scale, imgSize*this.Scale, imgSize*this.Scale)
            ctx.restore()
        }
    }
}


interface Drawable {
    Draw(x: number, y: number, t: CanvasRenderingContext2D, m: Array<Modifiers>): void
}

class Vector {
    X: number
    Y: number
    constructor(x: number, y: number) {
        this.X = x
        this.Y = y
    }
    Add(i: Vector): Vector {
        return new Vector(this.X + i.X, this.Y + i.Y)
    }
    Sub(i: Vector) {
        return new Vector(this.X - i.X, this.Y - i.Y)
    }
    ScalarTimes(z: number): Vector {
        return new Vector(this.X * z, this.Y * z)
    }
    ScalarDistanceFrom(other: Vector): number {
        var x = this.X - other.X
        var y = this.Y - other.Y
        return Math.sqrt(x*x + y*y)
    }
    Length(): number {
        return Math.sqrt(this.X * this.X + this.Y * this.Y)
    }
    UnitVector(): Vector {
        var scaleBy = 1 / this.ScalarDistanceFrom(new Vector(0,0))
        return new Vector(this.X * scaleBy, this.Y * scaleBy)
    }
    Rotate(rotateRadians: number): Vector {
        var currentRadians: number
        // avoid divide by zero
        if (this.X == 0) {
            currentRadians = this.Y >= 0? Math.PI/2 : Math.PI*1.5
        } else {
            currentRadians = Math.atan(this.Y / this.X)
        }
        // atan only resolves between -1/2Pi ... +1/2Pi. Need to detect ourselves if it's in the 2nd or 3rd quadrant
        if ( this.X < 0 ) {
            currentRadians += Math.PI
        }
        var nextRadians = currentRadians + rotateRadians
        var length = this.Length()
        var newY = Math.sin(nextRadians) * length
        var newX = Math.cos(nextRadians) * length
        return new Vector(newX, newY)
    }
}
interface Modifiers {
    OnActivity(): void
    Modify(ctx: CanvasRenderingContext2D): void
}

class BounceModifier implements Modifiers {
    lastActivity: number = 0

    OnActivity(): void {
        this.lastActivity = currentTicket
    }
    Modify(ctx: CanvasRenderingContext2D) : void {
        var diff = currentTicket - this.lastActivity
        if (diff < bounceTime/2) {
            ctx.scale(diff / 1000 + 1, diff / 1000 + 1)
        } else if (diff < bounceTime) {
            diff = bounceTime- diff
            ctx.scale(diff / 1000 + 1, diff / 1000 + 1)
        }
    }
}

class SpinModifier implements Modifiers {
    Angle: number = 0
    Speed: number = 0
    MinSpeed: number = 0
    constructor(minRotatationalVelocity: number = 0) {
        this.MinSpeed = minRotatationalVelocity

    }
    OnActivity(): void {
        this.Speed += 1
    }
    Modify(ctx: CanvasRenderingContext2D) : void {
        this.Angle += this.Speed
        ctx.rotate(this.Angle)
        this.Speed -= 0.01
        if (this.Speed < this.MinSpeed) {
            this.Speed = this.MinSpeed
        }
    }
}

const GravConst = 6.674e-5 // meant to be e-11, but give it some orders of magnitude 
class Mass {
    Obj: Drawable
    Position: Vector
    Velocity: Vector
    Mass: number // what is a sensible number range?

    Modifiers: Array<Modifiers> = []

    lastActivity = new Date().getTime()

    DrawWithAccel(accel: Vector, ctx: CanvasRenderingContext2D) {
        this.Velocity = this.Velocity.Add(accel)
        this.Position = this.Position.Add(this.Velocity)
        this.Obj.Draw(this.Position.X, this.Position.Y, ctx, this.Modifiers)
    }

    GetAccelWith(other: Mass): Vector {
        var distance = this.ScalarDistanceFrom(other)
        var force = GravConst * this.Mass * other.Mass / (distance * distance)
        var direction = other.Position.Sub(this.Position).UnitVector()
        return direction.ScalarTimes(force / this.Mass)
    }

    ScalarDistanceFrom(other: Mass): number {
        return this.Position.ScalarDistanceFrom(other.Position)
    }

    OnActivity() {
        this.lastActivity = currentTicket
        this.Modifiers.forEach((v) => { v.OnActivity()})
    }
}

class Engine {
    Context: CanvasRenderingContext2D
    Things: Mass[] = []

    RenderWorld(ctx: CanvasRenderingContext2D) {
        this.Things.forEach((t, outerI) => {
            var accel = new Vector(0,0)
            // hack: if there's no velocity, we glue the object in place.
            if (t.Velocity.X == 0 && t.Velocity.Y == 0) {
                t.DrawWithAccel(accel, ctx)
                return
            }
            this.Things.forEach((ot, innerI) => {
                if (innerI == outerI) {return}
                accel = accel.Add(t.GetAccelWith(ot))
            })
            t.DrawWithAccel(accel, ctx)
        })
    }

    Add(m: Mass) {
        this.Things.push(m)
    }
}

var middle = new Vector(window.innerWidth / 2, window.innerHeight /2)

function randomInTheMiddle(num: number): number {
    var v = Math.random() * (num /2 ) + num / 4
    // if (Math.abs((num / 2) - v) < num / 10) {
    //     return v * 3
    // }
    return v
}
function randInt(max: number): number { return Math.floor(Math.random() * max)}
function randomColour(): string {return `rgb(${randInt(255)},${randInt(255)},${randInt(255)})`}

function MakeMass(): Mass {
    
    var m = new Mass()
    m.Mass = Math.random() * 1000;
    m.Position = new Vector(randomInTheMiddle( target.width),randomInTheMiddle(target.height))

    // Generate crazy weird orbits
    //var speed = (Math.random() * 2 - 1) * 2
    // Generate elliptical orbits that vaguely stay on screen
    //var speed = Math.sqrt(m.Position.ScalarDistanceFrom(middle)) / 20
    // Generate circular orbits
    var rotationalVelocity = Math.max(Math.random() / 30, 0.02)
    var speed = Math.sqrt(GravConst * (m.Mass + FatMass().Mass) / m.Position.ScalarDistanceFrom(middle))
    m.Modifiers = [new BounceModifier(), new SpinModifier(rotationalVelocity)]
    m.Velocity = m.Position.Sub(middle).UnitVector().Rotate(Math.PI/2).ScalarTimes(speed)
    if (Math.random() < 0.5) {
        m.Velocity = m.Velocity.Rotate(Math.PI)
    }
    m.Obj = new Thing(randomColour())
    return m
}

function FatMass(img?: string): Mass {
    
    var m = new Mass()
    m.Position = middle
    m.Velocity = new Vector(0,0)
    m.Mass = 8000000;
    m.Modifiers = [new SpinModifier(0.01)]
    if (img != null) {
        m.Obj = new Img(img, 4)
    } else {
        m.Obj = new Thing("rgb(0,128,200)")
    }
    return m
}

console.log(middle)

var e = new Engine()
e.Context = ctx

function asdf() {
    currentTicket = new Date().getTime()
    e.Context.clearRect(0,0,target.width, target.height)
    e.RenderWorld(e.Context)
    window.requestAnimationFrame(asdf)
}
window.requestAnimationFrame(asdf)


var users: Map<string,Mass> = new Map()

var client = new WebSocket("ws://localhost:8888")
client.onmessage = (msg) => {
    console.log(msg.data)
    var d = JSON.parse(msg.data)
    switch (d['type']) {
        case "activity":
            var user = d['username'] as string
            if (users.get(user) == null) {
                var m = MakeMass()
                m.Obj = new Img(d['url'])
                e.Add(m)
                users.set(user, m)
            }
            users.get(user).OnActivity()
            break;
        case "host":
            var f = FatMass(d['url'])
            e.Add(f)
            break;
        default:
            console.log("Unknown type received: ", d['type'])
    }
}

// var imgs = [
//     "https://static-cdn.jtvnw.net/user-default-pictures-uv/ebe4cd89-b4f4-4cd9-adac-2f30151b4209-profile_image-70x70.png",
//     "https://static-cdn.jtvnw.net/user-default-pictures-uv/ebb84563-db81-4b9c-8940-64ed33ccfc7b-profile_image-70x70.png",
//     "https://static-cdn.jtvnw.net/user-default-pictures-uv/dbdc9198-def8-11e9-8681-784f43822e80-profile_image-70x70.png",
//     "https://static-cdn.jtvnw.net/user-default-pictures-uv/41780b5a-def8-11e9-94d9-784f43822e80-profile_image-70x70.png",
//     "https://static-cdn.jtvnw.net/jtv_user_pictures/moobot-profile_image-31a264a72aad34f7-70x70.png"
// ]

for (var i = 0; i < 50; i++ ){
    var m = MakeMass();
    e.Add(m)
}

// imgs.forEach(v => {
//     var m = MakeMass()
//     m.Obj = new Img(v)
//     e.Add(m)
// });
