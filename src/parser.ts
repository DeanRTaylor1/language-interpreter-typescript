import { Lox } from ".";
import { Binary, Expr, Literal, Unary, Grouping, Variable, Assign } from "./Expr";
import { Token, TokenType } from "./token-type";
import { Block, Expression, Print, Stmt, Var } from './Stmt'

class ParseError extends Error {
  readonly name = "ParseError"
  message: string
  line?: number;
  where?: string;

  constructor(message: string, line?: number, where?: string) {
    super()
    this.message = message;
    this.line = line;
    this.where = where;
  }
}



class Parser {
  private readonly tokens: Token[];
  private current: number;

  constructor(tokens: Token[]) {
    this.current = 0;
    this.tokens = tokens;
  }

  static error(token: Token, message: string): ParseError {
    Lox.tokenError(token, message)
    return new ParseError(message, token?.line, token?.lexeme)
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    //console.log(this.tokens)
    while (!this.isAtEnd()) {
      //console.log('while')
      statements.push(this.declaration())
    }
    return statements
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (err: any) {
      if (err instanceof ParseError) {
        this.synchronise();

      }
      throw err

    }
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if(this.match(TokenType.LEFT_BRACE)) return new Block(this.block())
    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value: Expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
    return new Print(value)
  }

  private varDeclaration(): Stmt {
    const name: Token | ParseError = this.consume(TokenType.IDENTIFIER, "Expect variable name.")

    let initialiser: Expr | null = null
    if (this.match(TokenType.EQUAL)) {
      initialiser = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.")
    if (name instanceof ParseError) {
      throw new Error("Parse Error detected")
    }
    return new Var(name, initialiser)
  }

  private expressionStatement(): Stmt {
    const expr: Expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after Expression")
    return new Expression(expr)
  }

  private block(): Stmt[] {
    const statements: Stmt[] = []
    //adding is EOF check to prevent infinity loops
   while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()){
      statements.push(this.declaration())
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
    return statements;
  }

  private assignment(): Expr {
    const expr: Expr = this.equality();
    if (this.match(TokenType.EQUAL)) {
      const equals: Token = this.previous();
      const value: Expr = this.assignment();

      if (expr instanceof Variable) {
        const name: Token = expr.name
        return new Assign(name, value)
      }

      Parser.error(equals, "Invalid assignment target")
    }

    return expr;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private equality(): Expr {
    let expr: Expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator: Token = this.previous();
      const right: Expr = this.comparison();
      expr = new Binary(expr, operator, right)
    }
    return expr
  }

  private match(...types: TokenType[]): Boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): Boolean {
    return this.peek().type === TokenType.EOF;

  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous() {
    return this.tokens[this.current - 1];
  }

  private comparison(): Expr {
    let expr: Expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator: Token = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right)
    }

    return expr;
  }


  private term(): Expr {
    let expr: Expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator: Token = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right)
    }

    return expr

  }

  private factor(): Expr {
    let expr: Expr = this.unary()

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      expr = new Binary(expr, operator, right)
    }
    return expr
  }


  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      return new Unary(operator, right)
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false)
    if (this.match(TokenType.TRUE)) return new Literal(true)
    if (this.match(TokenType.NIL)) return new Literal(null)
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal)
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous())
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
      return new Grouping(expr)
    }
    throw new Error("Something went wrong")
  }

  private consume(type: TokenType, message: string): Token | ParseError {
    if (this.check(type)) return this.advance();

    throw Parser.error(this.peek(), message);



  }

  private synchronise(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }
      this.advance();
    }
  }


}

export { Parser }