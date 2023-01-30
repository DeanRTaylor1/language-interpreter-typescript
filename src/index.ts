import fs from 'fs';
import { createInterface } from 'readline'

class Lox {
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
    console.log(src)
  }
  private static runPrompt(): void {
    const repl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ("\u001b[31m" + "[lox--repl] >>" + "    ")
    })

    repl.on("line", (input) => {
       if(input === 'exit'){
         repl.close();
       }
       run(input)
       repl.prompt();
    })

    repl.on("close", () => {
      process.exit(0)
    })
    repl.prompt();
  }
}



Lox.main()
