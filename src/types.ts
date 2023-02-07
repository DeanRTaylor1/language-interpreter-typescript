import { Environment } from "./env"
import { Interpreter } from "./interpreter"
import { Func as ExprFunc } from "./Expr"
import { RuntimeError } from "./errors"
import { Token } from "./token-type"

type LoxObject =
  | LoxClass
  | LoxInstance
  | LoxCallable
  | string
  | number
  | boolean
  | null

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

  private readonly name?: string
  private readonly declaration: ExprFunc
  private readonly closure: Environment
  private readonly isInitialiser: Boolean

  constructor(
    name: string | null,
    declaration: ExprFunc,
    closure: Environment,
    isInitialiser?: Boolean
  ) {
    super()
    this.declaration = declaration
    this.closure = closure
    if (!!name) {
      this.name = name
    }
    !!isInitialiser
      ? (this.isInitialiser = isInitialiser)
      : (this.isInitialiser = false)
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment: Environment = new Environment(this.closure)
    environment.define("this", instance)
    return new LoxFunction(
      this.name!,
      this.declaration,
      environment,
      this.isInitialiser
    )
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
        if (this.isInitialiser) return this.closure.getAt(0, "this")
        return err.value
      } else throw err
    }
    if (this.isInitialiser) return this.closure.getAt(0, "this")
    return null
  }

  public arity(): number {
    return this.declaration.params.length
  }

  public toString(): string {
    if (this.name === undefined) {
      return "<fn>"
    }
    return `<fn ${this.name}>`
  }
}

class LoxInstance {
  private klass: LoxClass
  private readonly fields: Map<string, LoxObject> = new Map()

  constructor(klass: LoxClass) {
    this.klass = klass
  }

  get(name: Token): LoxObject {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme) as LoxObject
    }
    const method: LoxFunction | null = this.klass.findMethod(name.lexeme)
    if (method !== null) return method.bind(this)

    throw new RuntimeError(name, "Undefined property '" + name.lexeme + "'.")
  }

  set(name: Token, value: LoxObject) {
    this.fields.set(name.lexeme, value)
  }
  public toString() {
    return this.klass.name + " instance"
  }
}

class LoxClass extends LoxCallable {
  readonly name: string
  private readonly methods: Map<string, LoxFunction>

  constructor(name: string, methods: Map<string, LoxFunction>) {
    super()
    this.name = name
    this.methods = methods
  }

  findMethod(name: string): LoxFunction | null {
    if (this.methods.has(name)) {
      return this.methods.get(name) as LoxFunction
    }
    return null
  }

  public call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    const instance = new LoxInstance(this)
    const initialiser: LoxFunction | null = this.findMethod("init")
    if (initialiser !== null) {
      initialiser.bind(instance).call(interpreter, args)
    }

    return instance
  }
  //TODO update to allow constructor methods
  public arity(): number {
    const initialiser: LoxFunction | null = this.findMethod("init")
    if (initialiser === null) return 0
    return initialiser.arity()
  }

  public toString() {
    return this.name
  }
}

export { LoxObject, LoxClass, LoxInstance }
