import { Environment } from "./env"
import { Interpreter } from "./interpreter"
import { Func as ExprFunc } from "./Expr"

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

  private readonly name?: string ;
  private readonly declaration: ExprFunc
  private readonly closure: Environment

  constructor(name: string | null, declaration: ExprFunc, closure: Environment) {
    super()
    this.declaration = declaration
    this.closure = closure
    if(!!name) {
      this.name = name;
    }
  }

  call(interpreter: Interpreter, args: LoxObject[]) {
    const environment: Environment = new Environment(this.closure)
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
    if(this.name === undefined) {
      return '<fn>'
    }
    return `<fn ${this.name}>`
  }
}

export { LoxObject }
