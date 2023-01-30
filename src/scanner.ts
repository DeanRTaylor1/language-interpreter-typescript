import { Lox } from '.';
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
      default: {
        Lox.err(this.line, "Unexpected Character")
      }
    }
  }
}


export { Scanner }
