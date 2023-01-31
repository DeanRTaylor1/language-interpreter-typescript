import {Token} from '../../src/token-type'


export interface Expr {

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
}
export class Grouping implements Expr {
  readonly expression: Expr;
  constructor(expression: Expr) {
    this.expression = expression;
  }
}
export class Literal implements Expr {
  readonly value: any;
  constructor(value: any) {
    this.value = value;
  }
}
export class Unary implements Expr {
  readonly operator: Token;
  readonly right: Expr;
  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }
}

