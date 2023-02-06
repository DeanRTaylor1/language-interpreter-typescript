import { Lox } from ".";
import { Token } from "./token-type";




class RuntimeError extends Error {
  readonly name: string;
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message)
    this.name = "Runtime Error"
    this.token = token;
  }
}



class BreakException extends Error {

}

export { RuntimeError, BreakException }
