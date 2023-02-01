import { Lox } from './index';
import { TokenType, Token } from './token-type'

class Scanner {
  private readonly src: string;
  private readonly tokens: Array<Token> = []
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;

  constructor(src: string) {
    this.src = src;
  }



  private static readonly keywords: Record<string, TokenType> = {
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE
  }

  scanTokens(): Array<Token> {
    while (!this.isAtEnd()) {
      //we are at the beginning of the next lexeme
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line))
    return this.tokens;

  }

  private isAtEnd(): Boolean {
    return this.current >= this.src.length;
  }

  private advance(): string {
    this.current++;
    return this.src.charAt(this.current - 1);
  }

  private addToken(type: TokenType, literal: any = null): void {
    let text: string = this.src.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  private scanToken(): void {
    let c = this.advance();

    switch (c) {
      case ")": {
        this.addToken(TokenType.RIGHT_PAREN)
        break;
      }
      case "(": {
        this.addToken(TokenType.LEFT_PAREN)
        break;
      }
      case "{": {
        this.addToken(TokenType.LEFT_BRACE)
        break;
      }
      case "}": {
        this.addToken(TokenType.RIGHT_BRACE)
        break;
      }
      case ",": {
        this.addToken(TokenType.COMMA)
        break;
      }
      case ".": {
        this.addToken(TokenType.DOT)
        break;
      }
      case "-": {
        this.addToken(TokenType.MINUS)
        break;
      }
      case "+": {
        this.addToken(TokenType.PLUS)
        break;
      }
      case ";": {
        this.addToken(TokenType.SEMICOLON)
        break;
      }
      case "*": {
        this.addToken(TokenType.STAR)
        break;
      }
      case "!": {
        this.addToken(this.matchOperator("=") ? TokenType.BANG_EQUAL : TokenType.BANG)
        break;
      }
      case "=": {
        this.addToken(this.matchOperator("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL)
        break;
      }
      case "<": {
        this.addToken(this.matchOperator("=") ? TokenType.LESS_EQUAL : TokenType.LESS)
        break;
      }
      case ">": {
        this.addToken(this.matchOperator("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER)
        break;
      }
      // forward slash can mean divide or comment a line therefore if we find two slashes we need to advance to the end of the line before continuing
      case "/": {
        if (this.matchOperator("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else if(this.matchOperator("*")){
          //if we are in a block of comments, continue until all of the nested blocks have been closed
          let nestCount = 1;
          while(nestCount > 0 && !this.isAtEnd()){
            console.log(nestCount)
            console.log("current " + this.peek(), "next: " + this.peekNext())
            if(this.peek() === "/" && this.peekNext() === "*" ) nestCount++;
            if(this.peek() === "*" && this.peekNext() === "/") nestCount--;
            this.advance();
          }
          if(nestCount > 0 && this.isAtEnd()){
            Lox.err(this.line, "Unexpected End of file => Unclosed block Comment")
          }
          this.advance();
        }
        else {
          this.addToken(TokenType.SLASH)
        }
        console.log('end')
        break;
      }
      //the following ignore whitespaces
      case " ": {
        break;
      }
      case "\r": {
        break;
      }
      case "\t": {
        break;
      }
      case "\n": {
        this.line++;
        break;
      }
      case `"`: {
        this.string();
        break;
      }
      default: {
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.err(this.line, "Unexpected Character")
        }
        break;
      }
    }
  }
  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    const text = this.src.substring(this.start, this.current);

    if (text in Scanner.keywords) {
      this.addToken(Scanner.keywords[text])
    } else {
      this.addToken(TokenType.IDENTIFIER)
    }
  }

  private isAlpha(c: string) {
    return (c >= "a" && c <= "z" ||
      c >= "A" && c <= "Z" ||
      c === "_"
    )
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private matchOperator(expected: string): Boolean {
    if (this.isAtEnd()) return false;
    if (this.src.charAt(this.current) !== expected) return false;
    this.current++
    return true;
  }
  private peek(): string {
    if (this.isAtEnd()) return "\0"
    return this.src.charAt(this.current);
  }
  private string(): void {
    while (this.peek() !== `"` && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }
    if (this.isAtEnd()) {
      Lox.err(this.line, "Unterminated string.");
      return;
    }

    this.advance();
    //here we remove any identifiers such as " so that we have the exact string, if we wanted to implement escape characters such as \n we would remove we would unescape them here so that we can use them in our compiler
    let value: string = this.src.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value)
  }



  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }


  private number(): void {
    while (this.isDigit(this.peek())) { this.advance(); }
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();


      while (this.isDigit(this.peek())) { this.advance(); }
    }
    this.addToken(TokenType.NUMBER, parseFloat(this.src.substring(this.start, this.current)))
  }


  private peekNext(): string {
    if (this.current + 1 >= this.src.length) return "\0";
    return this.src.charAt(this.current + 1)
  }



}


export { Scanner }
