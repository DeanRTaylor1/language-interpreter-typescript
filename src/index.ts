import fs from 'fs';
import { createInterface } from 'readline'
import { Scanner } from './scanner';

class Lox {
  public static hadError: Boolean = false;


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

    for (let token of tokens) {
      console.log(token)
    }

  }

  static err(line: number, message: string) {
    Lox.report(line, "", message);
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[@line >> ${line} ] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}


Lox.main()

export { Lox }
