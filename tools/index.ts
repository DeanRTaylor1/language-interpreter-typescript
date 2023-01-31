import fs from 'fs'

const start = () => {
  const args = process.argv.slice(2);

  if (args.length != 1) {
    console.error("Usage: Generate_AST <output dir>");
    process.exit(64)
  }
  const outputDir = args[0];


  defineAst(outputDir, "Expr", [
    "Binary : Expr left, Token operator, Expr right",
    "Grouping : Expr express",
    "Literal : Object value",
    "Unary : Token operator, Expr right"
  ])
}

const defineAst = (outDir: string, baseName: string, types: Array<string>): void => {
  const path: string = `${__dirname}/${outDir}/${baseName}.ts`

  const writer = fs.createWriteStream(path, {
    flags: 'a'
  })

  writer.write('Test\r\n')
  writer.write("more tests")
}


start();
