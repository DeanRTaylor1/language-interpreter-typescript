import { Token } from './token-type'

export interface Expr {
  accept<R>(visitor: Visitor<R>): R
}

export interface Visitor<R> {
  visitBinaryExpr(expr: Binary): R
  visitGroupingExpr(expr: Grouping): R
  visitLiteralExpr(expr: Literal): R
  visitUnaryExpr(expr: Unary): R
}
export class Binary implements Expr {
  readonly left: Expr;
  readonly operator: Token;
  readonly right: Expr;
  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
  accept<R>(visitor: Visitor<R>) {
    return visitor.visitBinaryExpr(this)
  }
}
export class Grouping implements Expr {
  readonly expression: Expr;
  constructor(expression: Expr) {
    this.expression = expression;
  }
  accept<R>(visitor: Visitor<R>) {
    return visitor.visitGroupingExpr(this)
  }
}
export class Literal implements Expr {
  readonly value: any;
  constructor(value: any) {
    this.value = value;
  }
  accept<R>(visitor: Visitor<R>) {
    return visitor.visitLiteralExpr(this)
  }
}
export class Unary implements Expr {
  readonly operator: Token;
  readonly right: Expr;
  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }
  accept<R>(visitor: Visitor<R>) {
    return visitor.visitUnaryExpr(this)
  }
}
