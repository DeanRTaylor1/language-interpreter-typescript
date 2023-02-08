import { Lox } from "."
import { RuntimeError, BreakException } from "./errors"
import {
  Assign,
  Binary,
  Call,
  Expr,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
  Func as ExprFunc,
  Visitor as ExprVisitor,
  LoxGet,
  LoxSet,
  This,
  Super,
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
  Func as StmtFunc,
  Return,
  Class,
} from "./Stmt"
import { Environment } from "./env"
import {
  LoxCallable,
  LoxClass,
  LoxClock,
  LoxFunction,
  LoxInstance,
  LoxObject,
} from "./types"
import { scope } from "./resolver"

class Interpreter implements ExprVisitor<LoxObject>, StmntVisitor<void> {
  readonly globals: Environment = new Environment()
  private environment: Environment = this.globals
  private readonly locals: Map<Expr, number> = new Map()

  constructor() {
    this.globals.define("clock", new LoxClock())
  }

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
      this.evaluate(statements)
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

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth)
  }

  public visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
  }

  public visitClassStmt(stmt: Class): void {
    let superclass: LoxObject | null = null
    if (!!stmt.superclass) {
      superclass = this.evaluate(stmt.superclass)
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(
          stmt.superclass.name,
          "Superclass must be a class."
        )
      }
    }


    this.environment.define(stmt.name.lexeme, null)


    let environment = this.environment
    if (!!stmt.superclass) {
      //if there is a superclass we add the parent class in scope stored in the value super
      environment = new Environment(environment)
      environment.define("super", superclass)
    }

    const methods: Map<string, LoxFunction> = new Map()
    for (let method of stmt.methods) {
      const func = new LoxFunction(
        method.name.lexeme,
        method.func,
        environment,
        method.name.lexeme === "init"
      )
      methods.set(method.name.lexeme, func)
    }


    let klass: LoxClass
    if (!!stmt.superclass) {
      klass = new LoxClass(stmt.name.lexeme, methods, superclass!)
    } else {
      klass = new LoxClass(stmt.name.lexeme, methods)
    }

    if (superclass !== null && environment.enclosing !== null) {
     environment = environment.enclosing
    }


    this.environment.assign(stmt.name, klass)
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

  public visitLoxSetExpr(expr: LoxSet): LoxObject {
    const object: LoxObject = this.evaluate(expr.object)

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, "Only instances have fields")
    }

    const value: LoxObject = this.evaluate(expr.value)

    object.set(expr.name, value)
    return value
  }

  public visitSuperExpr(expr: Super): LoxObject {
    const distance: number = this.locals.get(expr)!
    const superclass: LoxClass = this.environment.getAt(
      distance,
      "super"
    )! as LoxClass

    const obj: LoxObject = this.environment.getAt(
      distance - 1,
      "this"
    ) as LoxInstance

    const method: LoxFunction | null = superclass.findMethod(expr.method.lexeme)

    if (method === null) {
      throw new RuntimeError(
        expr.method,
        "Undefined property " + expr.method.lexeme + "."
      )
    }

    return method.bind(obj)
  }

  public visitThisExpr(expr: This): LoxObject {
    return this.lookUpVariable(expr.keyword, expr)
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

  public visitCallExpr(expr: Call): LoxObject {
    const callee: LoxObject = this.evaluate(expr.callee)

    const args: LoxObject[] = []

    for (const arg of expr.args) {
      args.push(this.evaluate(arg))
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(expr.paren, `Can only call functions`)
    }

    const func: LoxCallable = callee
    if (args.length != func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      )
    }
    return func.call(this, args)
  }

  public visitLoxGetExpr(expr: LoxGet): LoxObject {
    const object: LoxObject = this.evaluate(expr.object)
    if (object instanceof LoxInstance) {
      return object.get(expr.name)
    }
    throw new RuntimeError(expr.name, "Only instances have properties.")
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

  public visitFuncStmt(stmt: StmtFunc): void {
    const fnName = stmt.name.lexeme
    this.environment.define(
      fnName,
      new LoxFunction(fnName, stmt.func, this.environment)
    )
  }

  public visitFuncExpr(expr: ExprFunc): LoxObject {
    return new LoxFunction(null, expr, this.environment)
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

  public visitReturnStmt(stmt: Return): void {
    let value = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)

    throw new LoxFunction.Return(value)
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
    const distance = this.locals.get(expr)

    if (distance) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }
    return value
  }

  public visitVariableExpr(expr: Variable): LoxObject {
    return this.lookUpVariable(expr.name, expr)
  }

  public lookUpVariable(name: Token, expr: Expr): LoxObject {
    const distance = this.locals.get(expr)
    if (distance || distance === 0) {
      return this.environment.getAt(distance, name.lexeme)
    } else {
      return this.globals.get(name)
    }
  }
}

export { Interpreter }
