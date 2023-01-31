import { Binary, Expr, Grouping, Literal, Unary, Visitor } from './Expr'
import { Token, TokenType } from './token-type';

class AstPrinter implements Visitor<string> {
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


AstPrinter.main();
