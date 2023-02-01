import { Binary, Expr, Grouping, Literal, Unary, Visitor } from './Expr'
import { Token, TokenType } from './token-type';

class AstPrinter implements Visitor<string> {
  private runs: number = 0;
  print(expr: Expr): string {
    return expr.accept(this)
  }
  public visitBinaryExpr(expr: Binary): string {
    return this.parenthesise(expr.operator.lexeme, expr.left, expr.right)
  }
  public visitGroupingExpr(expr: Grouping): string {
    return this.parenthesise("group", expr.expression)
  }
  public visitLiteralExpr(expr: Literal): string {
    if (expr.value === null) return "nil";
    return expr.value.toString();
  }
  public visitUnaryExpr(expr: Unary): string {
    return this.parenthesise(expr.operator.lexeme, expr.right)
  }

  private parenthesise(name: string, ...exprs: Expr[]): string {
    //console.log("firstval: ", JSON.parse(JSON.stringify(exprs)))
    //prettyPrint(exprs[0]) 
    /*if(this.runs < 1){*/
      /*this.runs++*/
      /*prettyPrint(exprs)*/
    /*}*/
    const s: string[] = []
    s.push("(")
    s.push(name)
    for (const expr of exprs) {
      s.push(" ")
      s.push(expr.accept(this))
    }
    s.push(") ")
    
    return s.join("");
  }
  public static main(args?: string[]) {
    const expression: Expr = new Binary(new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)), new Token(TokenType.STAR, "*", null, 1), new Grouping(new Literal(45.67)));
    console.log(new AstPrinter().print(expression))
  }
}


function walk(...expr: any) {
  let indent = 1;
  let tree = Array.from(expr)
	tree.forEach(function(node: any) {
		console.log('--' + Array(indent).join('--'), node);
    if(node.accept) {
      indent ++;
      walk(node.accept);
    }
    if(tree.indexOf(node) === tree.length - 1) {
      indent--;
    }
	})
}


/*const prettyPrint = (node: any, prefix = "", isLeft = true) => {*/
  /*if (node.right) {*/
    /*prettyPrint(node.right, `${prefix}${isLeft ? "│   " : "    "}`, false);*/
  /*}*/
  /*console.log(`${prefix}${isLeft ? "└── " : "┌── "}${JSON.stringify(Object.values(node))}`);*/
  /*if (node.left) {*/
    /*prettyPrint(node.left, `${prefix}${isLeft ? "    " : "│   "}`, true);*/
  /*}*/
/*};*/


//AstPrinter.main();
export { AstPrinter }
