import { Token } from "./token-type"
import { LoxObject } from "./interpreter"
export interface Expr {
  accept<R>(visitor: Visitor<R>): R
}

export interface Visitor<R> {
  visitAssignExpr(expr: Assign): R
  visitBinaryExpr(expr: Binary): R
  visitGroupingExpr(expr: Grouping): R
  visitLiteralExpr(expr: Literal): R
  visitLogicalExpr(expr: Logical): R
  visitUnaryExpr(expr: Unary): R
  visitVariableExpr(expr: Variable): R
}
export class Assign implements Expr {
  readonly name: Token
  readonly value: Expr

  constructor(name: Token, value: Expr) {
    this.name = name
    this.value = value
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitAssignExpr(this)
  }
}

export class Binary implements Expr {
  readonly left: Expr
  readonly operator: Token
  readonly right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitBinaryExpr(this)
  }
}

export class Grouping implements Expr {
  readonly expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitGroupingExpr(this)
  }
}

export class Literal implements Expr {
  readonly value: LoxObject

  constructor(value: LoxObject) {
    this.value = value
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitLiteralExpr(this)
  }
}

export class Logical implements Expr {
  readonly left: Expr
  readonly operator: Token
  readonly right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitLogicalExpr(this)
  }
}

export class Unary implements Expr {
  readonly operator: Token
  readonly right: Expr

  constructor(operator: Token, right: Expr) {
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitUnaryExpr(this)
  }
}

export class Variable implements Expr {
  readonly name: Token

  constructor(name: Token) {
    this.name = name
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitVariableExpr(this)
  }
}
