import { Lox } from "."
import {
  Binary,
  Expr,
  Literal,
  Unary,
  Grouping,
  Variable,
  Assign,
  Logical,
  Call,
  Func as ExprFunc,
  LoxSet,
  LoxGet,
  This
} from "./Expr"
import { Token, TokenType } from "./token-type"
import {
  If,
  Block,
  Expression,
  Print,
  Stmt,
  Var,
  While,
  Break,
  Func as StmtFunc,
  Return,
  Class,
} from "./Stmt"
import { RuntimeError } from "./errors"

class ParseError extends Error {
  readonly name = "ParseError"
  message: string
  line?: number
  where?: string

  constructor(message: string, line?: number, where?: string) {
    super()
    this.message = message
    this.line = line
    this.where = where
  }
}

class Parser {
  private readonly tokens: Token[]
  private current: number
  private loopDepth: number

  constructor(tokens: Token[]) {
    this.current = 0
    this.tokens = tokens
    this.loopDepth = 0
  }

  static error(token: Token, message: string): ParseError {
    Lox.tokenError(token, message)
    return new ParseError(message, token?.line, token?.lexeme)
  }

  parse(): [Stmt[], Expr | null] {
    const statements: Stmt[] = []
    try {
      while (!this.isAtEnd()) {
        statements.push(this.declaration())
      }
      if (statements.length === 1 && statements[0] instanceof Expression) {
        this.current = 0
        return [statements, this.expression()]
      } else {
        return [statements, null]
      }
    } catch (err) {
      throw new RuntimeError(
        this.tokens[this.current],
        "Error in parsing tokens"
      )
    }
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.CLASS)) return this.classDeclaration()
      if (this.check(TokenType.FUNC) && this.checkNext(TokenType.IDENTIFIER)) {
        this.consume(TokenType.FUNC, "null")
        return this.func("function")
      }
      if (this.match(TokenType.VAR)) return this.varDeclaration()
      return this.statement()
    } catch (err: any) {
      if (err instanceof ParseError) {
        this.synchronise()
      }
      throw err
    }
  }

  private classDeclaration(): Stmt {
    const name: Token = this.consume(TokenType.IDENTIFIER, "Expect class name.")
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.")

    const methods: StmtFunc[] = []
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.func("method"))
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.")

    return new Class(name, methods)
  }

  private statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement()
    if (this.match(TokenType.IF)) return this.ifStatement()
    if (this.match(TokenType.PRINT)) return this.printStatement()
    if (this.match(TokenType.RETURN)) return this.returnStatement()
    if (this.match(TokenType.WHILE)) return this.whileStatement()
    if (this.match(TokenType.BREAK)) return this.breakStatement()
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block())
    return this.expressionStatement()
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.")

    let initialiser: Stmt | null
    if (this.match(TokenType.SEMICOLON)) {
      initialiser = null
    } else if (this.match(TokenType.VAR)) {
      initialiser = this.varDeclaration()
    } else {
      initialiser = this.expressionStatement()
    }

    let condition: Expr | null = null
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression()
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition;")

    let increment: Expr | null = null
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression()
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.")
    try {
      this.loopDepth++

      let body: Stmt = this.statement()

      if (increment !== null) {
        body = new Block([body, new Expression(increment)])
      }
      if (condition === null) condition = new Literal(true)
      body = new While(condition, body)

      if (initialiser !== null) {
        body = new Block([initialiser, body])
      }

      return body
    } finally {
      this.loopDepth--
    }
  }

  private breakStatement(): Stmt {
    if (this.loopDepth === 0) {
      throw new RuntimeError(
        this.previous(),
        "Must be inside a loop to use 'break'."
      )
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'break'.")

    return new Break()
  }

  private ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.")
    const condition: Expr = this.expression()
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.")

    const thenBranch: Stmt = this.statement()
    let elseBranch: Stmt | null = null
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement()
    }
    if (elseBranch) {
      return new If(condition, thenBranch, elseBranch)
    } else {
      return new If(condition, thenBranch)
    }
  }

  private printStatement(): Stmt {
    const value: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
    return new Print(value)
  }

  private returnStatement(): Stmt {
    const keyword: Token = this.previous()

    let value: Expr | null = null
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression()
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.")
    return new Return(keyword, value)
  }

  private varDeclaration(): Stmt {
    const name: Token | ParseError = this.consume(
      TokenType.IDENTIFIER,
      "Expect variable name."
    )

    let initialiser: Expr | null = null
    if (this.match(TokenType.EQUAL)) {
      initialiser = this.expression()
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.")
    if (name instanceof ParseError) {
      throw new Error("Parse Error detected")
    }
    return new Var(name, initialiser)
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
    const condition: Expr = this.expression()

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.")

    try {
      this.loopDepth++

      const body: Stmt = this.statement()

      return new While(condition, body)
    } finally {
      this.loopDepth--
    }
  }

  private expressionStatement(): Stmt {
    const expr: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, "Expect ';' after Expression")
    return new Expression(expr)
  }

  private block(): Stmt[] {
    let statements: Stmt[] = []
    //adding is EOF check to prevent infinity loops
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
    return statements
  }

  private assignment(): Expr {
    const expr: Expr = this.or()
    if (this.match(TokenType.EQUAL)) {
      const equals: Token = this.previous()
      const value: Expr = this.assignment()

      if (expr instanceof Variable) {
        const name: Token = expr.name
        return new Assign(name, value)
      } else if (expr instanceof LoxGet) {
        const get: LoxGet = expr
        return new LoxSet(get.object, get.name, value)
      }

      Parser.error(equals, "Invalid assignment target")
    }

    return expr
  }

  private func(kind: string): StmtFunc {
    const name = this.consume(TokenType.IDENTIFIER, "Expect " + kind + " name")
    return new StmtFunc(name, this.funcBody(kind))
  }

  private funcBody(kind: string): ExprFunc {
    this.consume(TokenType.LEFT_PAREN, "Expect  '(' after " + kind + " name")

    const parameters: Token[] = []

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 8) {
          throw new RuntimeError(
            this.peek(),
            "Can't have more than 8 parameters."
          )
        }
        parameters.push(
          this.consume(TokenType.IDENTIFIER, "Expect parameter name.")
        )
      } while (this.match(TokenType.COMMA))
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameter name.")

    this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body")
    const body: Stmt[] = this.block()

    return new ExprFunc(parameters, body)
  }

  private or(): Expr {
    let expr: Expr = this.and()

    while (this.match(TokenType.OR)) {
      const operator: Token = this.previous()
      const right = this.equality()
      expr = new Logical(expr, operator, right)
    }
    return expr
  }

  private and(): Expr {
    let expr: Expr = this.equality()
    while (this.match(TokenType.AND)) {
      const operator = this.previous()
      const right: Expr = this.equality()
      expr = new Logical(expr, operator, right)
    }
    return expr
  }

  private expression(): Expr {
    return this.assignment()
  }

  private equality(): Expr {
    let expr: Expr = this.comparison()

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator: Token = this.previous()
      const right: Expr = this.comparison()
      expr = new Binary(expr, operator, right)
    }
    return expr
  }

  private match(...types: TokenType[]): Boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd(): Boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous() {
    return this.tokens[this.current - 1]
  }

  private comparison(): Expr {
    let expr: Expr = this.term()

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator: Token = this.previous()
      const right = this.term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private term(): Expr {
    let expr: Expr = this.factor()

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator: Token = this.previous()
      const right = this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private factor(): Expr {
    let expr: Expr = this.unary()

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator: Token = this.previous()
      const right: Expr = this.unary()
      expr = new Binary(expr, operator, right)
    }
    return expr
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator: Token = this.previous()
      const right: Expr = this.unary()
      return new Unary(operator, right)
    }

    return this.call()
  }

  private finishCall(callee: Expr) {
    const args: Expr[] = []

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          throw new RuntimeError(
            this.peek(),
            "Can't have more than 255 arguments."
          )
        }
        args.push(this.expression())
      } while (this.match(TokenType.COMMA))
    }

    const paren: Token | ParseError = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments."
    )

    return new Call(callee, paren as Token, args)
  }

  private call(): Expr {
    let expr: Expr = this.primary()

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr)
      } else if (this.match(TokenType.DOT)) {
        const name: Token = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name after '.'."
        )
        expr = new LoxGet(expr, name)
      } else {
        break
      }
    }

    return expr
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false)
    if (this.match(TokenType.TRUE)) return new Literal(true)
    if (this.match(TokenType.NIL)) return new Literal(null)
    if (this.match(TokenType.FUNC)) return this.funcBody("function")
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal)
    }
    if(this.match(TokenType.THIS)) return new This(this.previous())
    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous())
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression()
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
      return new Grouping(expr)
    }
    throw new Error("Something went wrong")
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()

    throw Parser.error(this.peek(), message)
  }

  private checkNext(tokenType: TokenType): Boolean {
    if (this.isAtEnd()) return false
    if (this.tokens[this.current + 1].type === TokenType.EOF) return false
    return this.tokens[this.current + 1].type === tokenType
  }

  private synchronise(): void {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUNC:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return
      }
      this.advance()
    }
  }
}

export { Parser }
