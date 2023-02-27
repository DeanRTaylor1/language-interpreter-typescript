# language-interpreter-typescript

This is a language interpreter written for the toy language Lox.
It features a REPL mode you can use by running ts-node-dev ./index.ts
Or a file interpreter you can use by running ts-node-dev ./index.ts ""FILENAME""

## Language features
Declare variables with var
```var = "test"``` 

## Supports OOP class based inheritance 
``` <code> class baseClass {
  init(superstring1, string1, var2) {
  this.string1 = string1
  this.var2 = var2
  super.init(superstring1)
  } ```
  
 ``` func1 {
    print "executing function"
    }
}</code>```

##functions are first class and support closures such as:

```func returnFunction() {
  var outside = "outside";

  func inner() {
    print outside;
  }

  return inner;
}

var fn = returnFunction();
fn();```

## This interpreter supports control flow with if else and for/while loops:

```for (var a = 1; a < 10; a = a + 1) {
  print a;
}```

```var a = 1;
while (a < 10) {
  print a;
  a = a + 1;
}```

```if (condition) {
  print "yes";
} else {
  print "no";
}```
