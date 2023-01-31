import fs from 'fs'

const start = () => {
  const args = process.argv.slice(2);

  if (args.length != 1) {
    console.error("Usage: Generate_AST <output dir>");
    process.exit(64)
  }
  const outputDir = args[0];


  defineAst(outputDir, "Expr", [
    "Binary : left- Expr, operator- Token, right- Expr",
    "Grouping : expression- Expr",
    "Literal : value- any",
    "Unary : operator- Token, right- Expr"
  ])
}

const defineAst = (outDir: string, baseName: string, types: Array<string>): void => {
  const path: string = `${__dirname}/../src/${baseName}.ts`

  const writer = fs.createWriteStream(path, {
    flags: 'a'
  })

  writer.write(`import { Token } from '../../src/token-type'\r\n \r\n`)

  writer.write(`export interface ${baseName} { \r\n `)

  writer.write(`accept<R>(visitor: Visitor<R>): R`)
  writer.write("\r\n} \r\n")

  defineVisitor(writer, baseName, types)

  for (const type of types) {
    const className: string = type.split(":")[0].trim();
    const fields: string = type.split(":")[1].trim();
    defineType(writer, baseName, className, fields)
  }

  //writer.write("\r\n}")
}

const defineType = (writer: fs.WriteStream, baseName: string, className: string, fieldList: string) => {


  const fields: string[] = fieldList.split(", ");

  writer.write("\r\n   export class " + className + " implements " + baseName + " {")


  for (const field of fields) {
    writer.write("\r\n    readonly " + field.replace(/-\s+/g, ':') + ";")
  }

  writer.write("\r\n     " + "constructor(" + fieldList.replace(/-\s+/g, ':') + ") {")

  for (const field of fields) {
    let name: string = field.split(" ")[0];
    console.log(name.slice(0, -1))
    writer.write("\r\n      this." + name.slice(0, -1) + " = " + name.slice(0, -1) + ";")
  }

  writer.write(" \r\n }")
  writer.write(`\r\n accept<R>(visitor: Visitor<R>){
    return visitor.visit${className}${baseName}(this)
  }`)
  writer.write("\r\n}")



}

const defineVisitor = (writer: fs.WriteStream, baseName: string, types: string[]) => {
  writer.write(`\r\nexport interface Visitor<R> {`)

  for (const type of types) {
    const typeName: string = type.split(":")[0].trim();
    writer.write(`\r\n   visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R`)
  }
  writer.write(`\r\n }`)

}

start();
