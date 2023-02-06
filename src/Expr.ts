import { Token } from './token-type';
 import { Stmt } from './Stmt';
 import { LoxObject } from './types';
export interface Expr { 
 accept<R>(visitor: Visitor<R>): R
} 

export interface Visitor<R> {
   visitAssignExpr(expr: Assign): R
   visitBinaryExpr(expr: Binary): R
   visitFuncExpr(expr: Func): R
   visitCallExpr(expr: Call): R
   visitGroupingExpr(expr: Grouping): R
   visitLiteralExpr(expr: Literal): R
   visitLogicalExpr(expr: Logical): R
   visitUnaryExpr(expr: Unary): R
   visitVariableExpr(expr: Variable): R
 }
export class Assign implements Expr {
  readonly name: Token;
  readonly value: Expr;

  constructor(name: Token, value: Expr) {
    this.name = name;
    this.value = value; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitAssignExpr(this)
  }
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

  accept<R>(visitor: Visitor<R>){
    return visitor.visitBinaryExpr(this)
  }
}

export class Func implements Expr {
  readonly params: Token[];
  readonly body: Stmt[];

  constructor(params: Token[], body: Stmt[]) {
    this.params = params;
    this.body = body; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitFuncExpr(this)
  }
}

export class Call implements Expr {
  readonly callee: Expr;
  readonly paren: Token;
  readonly args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    this.callee = callee;
    this.paren = paren;
    this.args = args; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitCallExpr(this)
  }
}

export class Grouping implements Expr {
  readonly expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitGroupingExpr(this)
  }
}

export class Literal implements Expr {
  readonly value: LoxObject;

  constructor(value: LoxObject) {
    this.value = value; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitLiteralExpr(this)
  }
}

export class Logical implements Expr {
  readonly left: Expr;
  readonly operator: Token;
  readonly right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitLogicalExpr(this)
  }
}

export class Unary implements Expr {
  readonly operator: Token;
  readonly right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitUnaryExpr(this)
  }
}

export class Variable implements Expr {
  readonly name: Token;

  constructor(name: Token) {
    this.name = name; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitVariableExpr(this)
  }
}

