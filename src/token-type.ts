enum TokenType {
  //Single Character Tokens
  LEFT_PAREN = "LEFT_PAREN",
    RIGHT_PAREN = "RIGHT_PAREN", 
    LEFT_BRACE = "LEFT_BRACE",
    RIGHT_BRACE = "RIGHT_BRACE",
    COMMA = "COMMA", 
    DOT = "DOT",
    MINUS = "MINUS",
    PLUS = "PLUS",
    SEMICOLON = "SEMICOLON",
    SLASH = "SLASH", 
    STAR = "STAR",


  //One or two char Tokens
  BANG = "BANG" , 
  BANG_EQUAL = "BANG_EQUAL",
  EQUAL = "EQUAL", 
  EQUAL_EQUAL = "EQUAL_EQUAL",  
  GREATER = "GREATER",
  GREATER_EQUAL = "GREATER_EQUAL", 
  LESS = "LESS", 
  LESS_EQUAL = "LESS_EQUAL",

  //Literals
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",

  //keywords
  AND = "AND",
  CLASS = "CLASS",
  ELSE = "ELSE", 
  FALSE = "FALSE",
  FUN = "FUN",
  FOR = "FOR",
  IF = "IF",
  NIL = "NIL",
  OR = "OR",
  PRINT = "PRINT",
  RETURN = "RETURN",
  SUPER = "SUPER",
  THIS = "THIS",
  TRUE = "TRUE",
  VAR = "VAR",
  WHILE = "WHILE",
  BREAK = "BREAK",

  EOF = "EOF"
}


class Token {
  readonly type:TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly line: number;

  constructor(type: TokenType, lexeme: string, literal: any, line: number){
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  public toString(): string {
    return this.type + " " + this.lexeme + " " + this.literal
  }
}

export {TokenType, Token}
