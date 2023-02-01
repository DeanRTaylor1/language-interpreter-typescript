import fs from 'fs';
import { createInterface } from 'readline'
import { AstPrinter } from './ast-printer';
import { RuntimeError } from './errors';
import { Expr } from './Expr';
import { Interpreter } from './interpreter';
import { Parser } from './parser';
import { Scanner } from './scanner';
import { Token, TokenType } from './token-type';

class Lox {
  private static readonly interpreter: Interpreter = new Interpreter();

  public static hadError: Boolean = false;
  public static hadRuntimeError: Boolean = false;


  public static main(): void {
    const args = process.argv.slice(2)
    if (args.length > 1) {
      process.exit(64)
    } else if (args.length === 1) {
      Lox.runFile(args[0])
    } else {
      Lox.runPrompt()
    }
  }
  private static runFile(path: string): void {
    const src = fs.readFileSync(__dirname + path, { encoding: "utf8" })
    Lox.run(src)
    if (this.hadError) {
      process.exit(65);
    }
  }
  private static runPrompt(): void {
    const repl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ("\u001b[31m" + "[lox--repl] >>" + "    ")
    })

    repl.on("line", (input) => {
      if (input === 'exit') {
        repl.close();
      }
      Lox.run(input)
      this.hadError = false
      repl.prompt();
    })

    repl.on("close", () => {
      process.exit(0)
    })
    repl.prompt();
  }

  private static run(src: string): void {
    const scanner = new Scanner(src);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens)
    const expression: Expr = parser.parse();
    //console.log(expression)
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70)
    this.interpreter.interpret(expression)
    //console.log(expression)
    /* for (let token of tokens) {*/
    /*console.log(token)*/
    /*}*/
    //console.log(new AstPrinter().print(expression))
  }
  static tokenError(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, " at end", message)
    } else {
      this.report(token.line, ` at ${token.lexeme}'`, message)
    }
  }
  static err(line: number, message: string) {
    Lox.report(line, "", message);
  }

  static runtimeError(error: RuntimeError) {
    console.error(error.message + " \r\n[line" + error.token.line + "]")
    this.hadRuntimeError = true;
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[@line >> ${line} ] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}


Lox.main()

export { Lox }
