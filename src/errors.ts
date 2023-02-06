import { Token } from "./token-type"

export class RuntimeError extends Error {
  readonly name: string
  readonly token: Token

  constructor(token: Token, message: string) {
    super(message)
    this.name = "Runtime Error"
    this.token = token
  }
}

export class BreakException extends Error {}

//not strictly an error but we are using errors to unwind the call stack

