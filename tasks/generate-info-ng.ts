import * as ts from "typescript";
import * as fs from "fs";

// npx tsc aa.ts --m commonjs; node aa.js src/ol/source/TileJSON.js

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  let program = ts.createProgram(fileNames, options);
  let checker = program.getTypeChecker();

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, visit);
    }
  }

  // fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }
    console.log(node.kind);
    if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      console.log('namoux', node.kind);
      ts.forEachChild(node, visit);
    } else {
      let symbol = checker.getSymbolAtLocation(node.name);
      if (ts.isExportAssignment(node)) {
        console.log('default');
      } else if (symbol) {
        console.log('named', node.kind, symbol.getName());
      }
    }
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(<ts.Declaration>node) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

generateDocumentation(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  allowJs: true,
  module: ts.ModuleKind.CommonJS
});
