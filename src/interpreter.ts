import { Lox } from "."
import { RuntimeError, BreakException } from "./errors"
import {
  Assign,
  Binary,
  Expr,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
  Visitor as ExprVisitor,
} from "./Expr"
import { Token, TokenType } from "./token-type"
import {
  Block,
  Expression,
  Print,
  Stmt,
  Var,
  If,
  Visitor as StmntVisitor,
  While,
  Break,
} from "./Stmt"
import { Environment } from "./env"

export type LoxObject = string | number | boolean | null

class Interpreter implements ExprVisitor<LoxObject>, StmntVisitor<void> {
  private environment: Environment = new Environment()

  interpret(statements: Stmt[] | Expr): void {
    if (statements instanceof Array) {
      try {
        //console.log(statements)
        for (const statement of statements) {
          statement && this.execute(statement)
        }
      } catch (err: any) {
        console.log("error")
        Lox.runtimeError(err)
      }
    } else {
      const value = this.evaluate(statements)
    }
  }

  private stringify(object: LoxObject): string {
    if (object === null) return "nil"
    if (typeof object === "number") {
      let text: string = object.toString()
      if (text.slice(-2) === ".0") {
        text = text.slice(0, -2)
      }
      return text
    }
    return object.toString()
  }

  private isEqual(a: LoxObject, b: LoxObject) {
    if (a === null && b === null) return true
    if (a === null) return false
    return a === b
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this)
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this)
  }

  public visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    //when we find a block of code, we update the current scope and store the previous scope (which could have it's own stored previous scope we then operate the block of code using the new local scope)
    const previous: Environment = this.environment
    try {
      this.environment = environment
      for (const statement of statements) {
        statement && this.execute(statement)
      }
    } finally {
      this.environment = previous
    }
  }

  private checkNumberOperand(operator: Token, operand: LoxObject): void {
    if (typeof operand === "number") return
    throw new RuntimeError(operator, "Operand must be a number")
  }
  private checkNumberOperands(
    operator: Token,
    left: LoxObject,
    right: LoxObject
  ): void {
    if (typeof left === "number" && typeof right === "number") return
    throw new RuntimeError(operator, "Operands must both be a number")
  }
  public visitLiteralExpr(expr: Literal) {
    return expr.value
  }

  public visitLogicalExpr(expr: Logical): LoxObject {
    const left: LoxObject = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.OR) {
      if (!!left) return left
    } else {
      if (!left) return left
    }
    return this.evaluate(expr.right)
  }

  public visitGroupingExpr(expr: Grouping) {
    return this.evaluate(expr.expression)
  }

  public visitBinaryExpr(expr: Binary): LoxObject {
    const left: LoxObject = this.evaluate(expr.left)
    const right: LoxObject = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        //console.log(expr.operator.type, left, right, left !== right)
        return left! !== right!
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right)
      case TokenType.GREATER:
        //console.log(expr.operator.type, left, right, left === right)
        this.checkNumberOperands(expr.operator, left, right)
        return +left! > +right!

      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! >= +right!

      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! < +right!

      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! <= +right!

      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! - +right!

      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number")
          return +left! + +right!

        if (typeof left === "string" && typeof right === "string")
          return left!.toString() + right!.toString()

        throw new RuntimeError(
          expr.operator,
          "Operands must be either two numbers or two strings."
        )

      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! / +right!

      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right)
        return +left! * +right!
    }
    return null
  }

  public visitUnaryExpr(expr: Unary): LoxObject {
    const right: LoxObject = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.BANG: {
        return !!!right
      }
      case TokenType.MINUS: {
        this.checkNumberOperand(expr.operator, right)
        return -+right!
      }
    }

    return null
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  public visitIfStmt(stmt: If): void {
    //check if the condition is truthy and exeucute the statement
    //if the statement is falsey check if there is an else and execute or return
    if (!!this.evaluate(stmt.condition)) {
      this.execute(stmt.thenBranch)
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch)
    }
  }

  public visitBreakStmt(stmt: Break): void {
    throw new BreakException()
  }

  public visitPrintStmt(stmt: Print): void {
    const value: LoxObject = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
  }

  public visitVarStmt(stmt: Var) {
    let value: LoxObject | null = null
    if (stmt.initialiser !== null) {
      value = this.evaluate(stmt.initialiser)
    }

    this.environment.define(stmt.name.lexeme, value)
  }

  public visitWhileStmt(stmt: While): void {
    try {
      while (!!this.evaluate(stmt.condition)) {
        this.execute(stmt.body)
      }
    } catch (err) {}
  }

  public visitAssignExpr(expr: Assign): LoxObject {
    const value: LoxObject = this.evaluate(expr.value)
    //console.log(this.environment.values, this.environment.values.get('temp'), "temp")
    this.environment.assign(expr.name, value)
    return value
  }

  public visitVariableExpr(expr: Variable): LoxObject {
    return this.environment.get(expr.name)
  }
}

export { Interpreter }
