import { RuntimeError } from "./errors"
import { LoxObject } from "./types"
import { Token } from "./token-type"

export class Environment {
  private readonly values: Record<string, LoxObject> = {}
  readonly enclosing: Environment | null

  constructor(enclosing?: Environment) {
    enclosing ? (this.enclosing = enclosing) : (this.enclosing = null)
  }

  define(name: string, value: LoxObject) {
    this.values[name] = value
  }

  getAt(distance: number, name: string) {
    return this.ancestor(distance).values[name]
  }

  assignAt(distance: number, name: Token, value: LoxObject): void {
    this.ancestor(distance).values[name.lexeme] = value
  }

  ancestor(distance: number): Environment {
    if(distance === 0) return this
    let environment: Environment = this

    for (let i = 0; i < distance; i++) {
      if (environment.enclosing) {
        environment = environment.enclosing
      }
    }
    return environment
  }

  get(name: Token): LoxObject {
    //console.log(name.lexeme in this.values)
    if (name.lexeme in this.values) {
      return this.values[name.lexeme]
    }
    if (this.enclosing !== null) return this.enclosing.get(name)
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
  }

  assign(name: Token, value: LoxObject): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value
      return
    }
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
  }
}
