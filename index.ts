console.log("hello")
var target = document.getElementById("galaxy") as HTMLCanvasElement
target.height = window.innerHeight
target.width = window.innerWidth
var ctx  = target.getContext("2d")
var i = 0

class Thing {
    
    Colour: string

    constructor(color: string) {
        this.Colour = color
    }
    Draw(x: number, y: number, t: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.Colour
        ctx.fillRect(x, y,50,50)
    }
}

interface Drawable {
    Draw(x: number, y: number, t: CanvasRenderingContext2D): void
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
    UnitVector(): Vector {
        var scaleBy = 1 / this.ScalarDistanceFrom(new Vector(0,0))
        return new Vector(this.X * scaleBy, this.Y * scaleBy)
    }
}

const GravConst = 6.674e-5 // meant to be e-11, but give it some orders of magnitude 
class Mass {
    Obj: Drawable
    Position: Vector
    Velocity: Vector
    Mass: number // what is a sensible number range?

    DrawWithAccel(accel: Vector, ctx: CanvasRenderingContext2D) {
        this.Velocity = this.Velocity.Add(accel)
        this.Position = this.Position.Add(this.Velocity)
        this.Obj.Draw(this.Position.X, this.Position.Y, ctx)
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
}

class Engine {
    Context: CanvasRenderingContext2D
    Things: Mass[]

    RenderWorld(ctx: CanvasRenderingContext2D) {
        this.Things.forEach((t, outerI) => {
            var accel = new Vector(0,0)
            this.Things.forEach((ot, innerI) => {
                if (innerI == outerI) {return}
                accel = accel.Add(t.GetAccelWith(ot))
            })
            t.DrawWithAccel(accel, ctx)
        })
    }

}

function MakeMass(): Mass {
    
    var m = new Mass()
    m.Position = new Vector(Math.random() * target.width/2, Math.random() * target.height/2)
    m.Velocity = new Vector((Math.random() * 2 -1) / 2, (Math.random() * 2 -1) / 2)
    m.Mass = Math.random() * 1000;
    m.Obj = new Thing("rgb(255,128,200)") 
    return m
}

function FatMass(): Mass {
    
    var m = new Mass()
    m.Position = new Vector(target.width/2 ,target.height/2)
    m.Velocity = new Vector(0,0)
    m.Mass = 1000000;
    m.Obj = new Thing("rgb(0,128,200)") 
    return m
}


var e = new Engine()
e.Context = ctx
e.Things = [FatMass(), MakeMass(), MakeMass(), MakeMass()]

function asdf() {
    //e.Context.clearRect(0,0,1000,1000)
    e.RenderWorld(e.Context)
    window.requestAnimationFrame(asdf) 
}
window.requestAnimationFrame(asdf) 
