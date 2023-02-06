import { Environment } from "./env"
import { Interpreter } from "./interpreter"
import { Func } from "./Stmt"

type LoxObject = LoxCallable | string | number | boolean | null

export abstract class LoxCallable {
  abstract call(interpreter: Interpreter, args: LoxObject[]): LoxObject
  abstract arity(): number
}

export class LoxClock implements LoxCallable {
  public arity(): number {
    return 0
  }
  public call(): LoxObject {
    return Date.now().valueOf() / 1000
  }
  public toString(): string {
    return "<native fn>"
  }
}

export class LoxFunction extends LoxCallable {
  static Return = class Return {
    readonly value: LoxObject
    constructor(value: LoxObject) {
      this.value = value
    }
  }

  private readonly declaration: Func

  constructor(declaration: Func) {
    super()
    this.declaration = declaration
  }

  call(interpreter: Interpreter, args: LoxObject[]) {
    const environment: Environment = new Environment(interpreter.globals)
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i])
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (err: any) {
      if (err instanceof LoxFunction.Return) {
        return err.value
      } else throw err
    }
    return null
  }

  public arity(): number {
    return this.declaration.params.length
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}

export { LoxObject }
