import { Lox } from "."
import { RuntimeError } from "./errors"
import {
  Assign,
  Binary,
  Call,
  Expr,
  Func as ExprFunc,
  Grouping,
  Literal,
  Logical,
  LoxGet,
  LoxSet,
  Super,
  This,
  Unary,
  Variable,
  Visitor as ExprVisitor,
} from "./Expr"
import { Interpreter } from "./interpreter"
import {
  Block,
  Break,
  Class,
  Expression,
  Func as StmtFunc,
  If,
  Print,
  Return,
  Stmt,
  Var,
  Visitor as StmtVisitor,
  While,
} from "./Stmt"
import { Token } from "./token-type"
import { LoxInstance, LoxObject } from "./types"

export type scope = Map<string, boolean>

export enum FunctionType {
  NONE = "NONE",
  FUNCTION = "FUNCTION",
  INITIALISER = "INITIALISER",
  METHOD = "METHOD",
}

export enum ClassType {
  NONE = "NONE",
  CLASS = "CLASS",
  SUBCLASS = "SUBCLASS",
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter
  private readonly scopes: scope[] = []
  private currentFunction: FunctionType = FunctionType.NONE
  private currentClass: ClassType = ClassType.NONE

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
  }

  public visitBlockStmt(stmt: Block): void {
    this.beginScope()
    this.resolve(stmt.statements)
    this.endScope()
  }

  public visitClassStmt(stmt: Class): void {
    const enclosingClass = this.currentClass
    this.currentClass = ClassType.CLASS

    this.declare(stmt.name)
    this.define(stmt.name)

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      Lox.tokenError(stmt.superclass.name, "A class can't inherit from itself.")
    }
    if (stmt.superclass) {
      this.currentClass = ClassType.SUBCLASS
      this.resolve(stmt.superclass)
    }

    if (stmt.superclass) {
      this.beginScope()
      this.peek(this.scopes).set("super", true)
    }
    this.beginScope()
    this.peek(this.scopes).set("this", true)

    for (let method of stmt.methods) {
      let declaration: FunctionType = FunctionType.METHOD
      if (method.name.lexeme === "init") {
        declaration = FunctionType.INITIALISER
      }
      this.resolveStmtFunction(method, declaration)
    }

    this.endScope()
    if (stmt.superclass) this.endScope()
    this.currentClass = enclosingClass
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.resolve(stmt.expression)
  }

  public visitFuncStmt(stmt: StmtFunc): void {
    //How will this work with anonymous functions?
    this.declare(stmt.name)
    this.define(stmt.name)

    this.resolveStmtFunction(stmt, FunctionType.FUNCTION)
  }

  visitFuncExpr(expr: ExprFunc): void {
    this.resolveExprFunction(expr, FunctionType.FUNCTION)
  }

  visitBreakStmt(stmt: Break): void {
    return
  }

  public visitIfStmt(stmt: If): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.thenBranch)
    if (stmt.elseBranch) this.resolve(stmt.elseBranch)
  }

  public visitPrintStmt(stmt: Print): void {
    this.resolve(stmt.expression)
  }

  public visitReturnStmt(stmt: Return): void {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.tokenError(stmt.keyword, "Can't return from top-level code.")
    }
    if (stmt.value !== null) {
      if (this.currentFunction === FunctionType.INITIALISER) {
        Lox.tokenError(stmt.keyword, "Can't return a value from an initializer")
      }
      this.resolve(stmt.value)
    }
  }

  public visitWhileStmt(stmt: While): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.body)
  }

  public visitBinaryExpr(expr: Binary): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  public visitCallExpr(expr: Call): void {
    this.resolve(expr.callee)

    for (let argument of expr.args) {
      this.resolve(argument)
    }
  }

  public visitLoxGetExpr(expr: LoxGet): void {
    this.resolve(expr.object)
  }

  public visitGroupingExpr(expr: Grouping): void {
    this.resolve(expr.expression)
  }

  public visitLiteralExpr(expr: Literal): void {
    return
  }

  public visitLogicalExpr(expr: Logical): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  public visitLoxSetExpr(expr: LoxSet): void {
    this.resolve(expr.value)
    this.resolve(expr.object)
  }

  public visitSuperExpr(expr: Super): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.tokenError(expr.keyword, "Can't use 'super' outside of a class!")
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Lox.tokenError(expr.keyword, "Can't use 'super' witout a superclass.")
    }
    this.resolveLocal(expr, expr.keyword)
  }

  public visitThisExpr(expr: This): void {
    if (this.currentClass === ClassType.NONE) {
      return Lox.tokenError(
        expr.keyword,
        "Can't use 'this' outside of a class."
      )
    }
    this.resolveLocal(expr, expr.keyword)
  }

  public visitUnaryExpr(expr: Unary): void {
    this.resolve(expr.right)
  }

  resolve(statements: Stmt[]): void
  resolve(stmt: Stmt | Expr): void
  resolve(statements: Stmt[] | Stmt | Expr): void {
    if (statements instanceof Array) {
      for (let stmt of statements) {
        this.resolve(stmt)
      }
    } else statements.accept(this)
  }

  public resolveStmtFunction(func: StmtFunc, type: FunctionType) {
    const enclosingFunction = this.currentFunction
    this.currentFunction = type
    this.beginScope()
    for (let param of func.func.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolve(func.func.body)
    this.endScope()
    this.currentFunction = enclosingFunction
  }

  public resolveExprFunction(func: ExprFunc, type: FunctionType) {
    const enclosingFunction = this.currentFunction
    this.currentFunction = type
    this.beginScope()
    for (let param of func.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolve(func.body)
    this.endScope()
    this.currentFunction = enclosingFunction
  }

  private peek(scopes: scope[]): scope {
    return scopes[scopes.length - 1]
  }
  private beginScope() {
    this.scopes.push(new Map<string, boolean>())
  }

  private endScope(): void {
    this.scopes.pop()
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return
    const scope: scope = this.peek(this.scopes)
    if (scope.has(name.lexeme)) {
      throw new RuntimeError(
        name,
        "Already defined variable with this name in this scope"
      )
    }
    scope.set(name.lexeme, false)
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return
    this.peek(this.scopes).set(name.lexeme, true)
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
        return
      }
    }
  }

  public visitVarStmt(stmt: Var): void {
    this.declare(stmt.name)
    if (stmt.initialiser !== null) {
      this.resolve(stmt.initialiser)
    }
    this.define(stmt.name)
  }

  public visitAssignExpr(expr: Assign): void {
    this.resolve(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  public visitVariableExpr(expr: Variable): void {
    if (
      this.scopes.length !== 0 &&
      this.peek(this.scopes).get(expr.name.lexeme) === false
    ) {
      Lox.err(
        expr.name.line,
        "Can't read local variable in its own initializer."
      )
    }
    this.resolveLocal(expr, expr.name)
  }
}
