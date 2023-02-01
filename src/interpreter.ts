import { Lox } from ".";
import { RuntimeError } from "./errors";
import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./Expr";
import { Token, TokenType } from "./token-type";

export type LoxObject =
  | string
  | number
  | boolean
  | null

class Interpreter implements Visitor<LoxObject> {

  interpret(expression: Expr): void {
    try {
      const value: LoxObject = this.evaluate(expression)
      console.log(this.stringify(value))
    } catch (err: any) {
      console.log('error')
      Lox.runtimeError(err)
    }
  }

  private stringify(object: LoxObject): string {
    if (object === null) return "nil"
    if (typeof object === "number") {
      let text: string = object.toString();
      if (text.slice(-2) === ".0") {
        text = text.slice(0, -2)
      }
      return text;
    }
    return object.toString();

  }

  private isEqual(a: LoxObject, b: LoxObject) {
    if (a === null && b === null) return true;
    if (a === null) return false;
    return a === b;
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this)
  }

  private checkNumberOperand(operator: Token, operand: LoxObject): void {
    if (typeof operand === 'number') return;
    throw new RuntimeError(operator, "Operand must be a number")

  }
  private checkNumberOperands(operator: Token, left: LoxObject, right: LoxObject): void {
    if (typeof left === 'number' && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must both be a number")

  }
  public visitLiteralExpr(expr: Literal) {
    return expr.value
  }

  public visitGroupingExpr(expr: Grouping) {
    return this.evaluate(expr.expression)
  }

  public visitBinaryExpr(expr: Binary): LoxObject {
    const left: LoxObject = this.evaluate(expr.left)
    const right: LoxObject = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL: {
        return +left! !== +right!;
      }
      case TokenType.EQUAL_EQUAL: {
        return this.isEqual(left, right)
      }
      case TokenType.GREATER: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! > +right!;
      }
      case TokenType.GREATER_EQUAL: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! >= +right!;
      }
      case TokenType.LESS: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! < +right!;
      }
      case TokenType.LESS_EQUAL: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! <= +right!;
      }
      case TokenType.MINUS: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! - +right!
      }
      case TokenType.PLUS: {
        if (typeof left === 'number' && typeof right === "number") {
          return +left! + +right!
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left!.toString() + right!.toString();
        }
        throw new RuntimeError(expr.operator, "Operands must be either two numbers or two strings.")
      }
      case TokenType.SLASH: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! / + right!
      }
      case TokenType.STAR: {
        this.checkNumberOperands(expr.operator, left, right)
        return +left! * +right!
      }
    }
    return null;
  }

  public visitUnaryExpr(expr: Unary): LoxObject {
    const right: LoxObject = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.BANG: {
        return !(!!right)
      }
      case TokenType.MINUS: {
        this.checkNumberOperand(expr.operator, right)
        return -(+right!)
      }

    }

    return null
  }

}

export { Interpreter }
