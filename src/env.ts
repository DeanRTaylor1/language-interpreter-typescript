import { RuntimeError } from "./errors";
import { LoxObject } from "./interpreter";
import { Token } from "./token-type";


export class Environment {
  private readonly values: Record<string, LoxObject> = {};
  readonly enclosing: Environment | null;

  constructor(enclosing?: Environment) {
    enclosing ? this.enclosing = enclosing : this.enclosing = null;
  }

  define(name: string, value: LoxObject) {
    this.values[name] = value
  }

  get(name: Token): LoxObject {
    if (this.values[name.lexeme]) {
      return this.values[name.lexeme]
    }
    if (this.enclosing !== null) return this.enclosing.get(name)
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
  }

  assign(name: Token, value: LoxObject): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return
    }
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return;
    }
    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
  }

}
