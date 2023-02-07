import { Token } from './token-type';
 import { Expr, Func as ExprFunc } from './Expr';
 export interface Stmt { 
 accept<R>(visitor: Visitor<R>): R
} 

export interface Visitor<R> {
   visitBlockStmt(stmt: Block): R
   visitClassStmt(stmt: Class): R
   visitBreakStmt(stmt: Break): R
   visitExpressionStmt(stmt: Expression): R
   visitFuncStmt(stmt: Func): R
   visitIfStmt(stmt: If): R
   visitPrintStmt(stmt: Print): R
   visitReturnStmt(stmt: Return): R
   visitVarStmt(stmt: Var): R
   visitWhileStmt(stmt: While): R
 }
export class Block implements Stmt {
  readonly statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitBlockStmt(this)
  }
}

export class Class implements Stmt {
  readonly name: Token;
  readonly methods: Func[];

  constructor(name: Token, methods: Func[]) {
    this.name = name;
    this.methods = methods; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitClassStmt(this)
  }
}

export class Break implements Stmt {

  constructor() { 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitBreakStmt(this)
  }
}

export class Expression implements Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitExpressionStmt(this)
  }
}

export class Func implements Stmt {
  readonly name: Token;
  readonly func: ExprFunc;

  constructor(name: Token, func: ExprFunc) {
    this.name = name;
    this.func = func; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitFuncStmt(this)
  }
}

export class If implements Stmt {
  readonly condition: Expr;
  readonly thenBranch: Stmt;
  readonly elseBranch?: Stmt;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitIfStmt(this)
  }
}

export class Print implements Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitPrintStmt(this)
  }
}

export class Return implements Stmt {
  readonly keyword: Token;
  readonly value: Expr | null;

  constructor(keyword: Token, value: Expr | null) {
    this.keyword = keyword;
    this.value = value; 
 }

  accept<R>(visitor: Visitor<R>){
    return visitor.visitReturnStmt(this)
  }
}

export class Var implements Stmt {
  readonly name: Token;
  readonly initialiser: Expr | null;

  constructor(name: Token, initialiser: Expr | null) {
    this.name = name;
    this.initialiser = initialiser; 
 }

  accept<R>(visitor: Visitor<R>){
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

  accept<R>(visitor: Visitor<R>){
    return visitor.visitWhileStmt(this)
  }
}

