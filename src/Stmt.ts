import { Token } from './token-type';
import { Expr } from './Expr';



export interface Stmt {
  accept<R>(visitor: Visitor<R>): R
}

export interface Visitor<R> {
  visitBlockStmt(stmt: Block): R
  visitExpressionStmt(stmt: Expression): R
  visitIfStmt(stmt: If): R
  visitPrintStmt(stmt: Print): R
  visitVarStmt(stmt: Var): R
  visitWhileStmt(stmt: While): R
}
export class Block implements Stmt {
  readonly statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitBlockStmt(this)
  }
}

export class Expression implements Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitExpressionStmt(this)
  }
}

export class If implements Stmt {
  readonly condition: Expr;
  readonly thenBranch: Stmt;
  readonly elseBranch?: Stmt | null;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    !!elseBranch ? this.elseBranch = elseBranch : this.elseBranch = null;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitIfStmt(this)
  }
}

export class Print implements Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitPrintStmt(this)
  }
}

export class Var implements Stmt {
  readonly name: Token;
  readonly initialiser: Expr | null;

  constructor(name: Token, initialiser: Expr | null) {
    this.name = name;
    this.initialiser = initialiser;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitVarStmt(this)
  }
}

export class While implements Stmt {
  readonly condition: Expr;
  readonly body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition;
    this.body = body;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitWhileStmt(this)
  }
}

