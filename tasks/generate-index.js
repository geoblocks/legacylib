"use strict";

const fs = require('fs');
const path = require('path');

function generateInfo() {
  return JSON.parse(fs.readFileSync('build/info.json'));
}

/**
 * Read the symbols from info file.
 * @return {Array} Resolves with an array of symbol objects.
 */
function getSymbols() {
  const info = generateInfo();
  return info.symbols.filter(symbol => symbol.kind !== 'member');
}

let root;
/**
 * @param {string} importString
 */
function extractRoot(importString) {
  const firstSlash = importString.indexOf('/');
  console.assert(firstSlash, 1);
  const secondSlash = importString.indexOf('/', firstSlash + 1);
  const currentRoot = importString.substring(firstSlash + 1, secondSlash);
  if (root && currentRoot !== root) {
    console.assert(false, `Mismatching roots: ${currentRoot} and ${root}`);
  }
  root = currentRoot;
}

/**
 * Generate a list of imports.
 * @param {Array<Object>} symbols List of symbols.
 * @return {Array} A list of imports sorted by export name.
 */
function getImports(symbols) {
  const imports = {};
  symbols.forEach(symbol => {
    const defaultExport = symbol.name.split('~');
    const namedExport = symbol.name.split('.');
    if (defaultExport.length > 1) {
      const from = defaultExport[0].replace(/^module\:/, './');
      extractRoot(from);
      const importName = from.replace(/[.\/]+/g, '$');
      const defaultImport = `import ${importName} from '${from}';`;
      imports[defaultImport] = true;
    } else if (namedExport.length > 1) {
      const from = namedExport[0].replace(/^module\:/, './');
      extractRoot(from);
      const importName = from.replace(/[.\/]+/g, '_');
      const namedImport = `import * as ${importName} from '${from}';`;
      imports[namedImport] = true;
    }
  });
  return Object.keys(imports).sort();
}


/**
 * Generate code to export a named symbol.
 * @param {string} name Symbol name.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @return {string} Export code.
 */
function formatSymbolExport(name, namespaces) {
  const parts = name.split('~');
  const isNamed = parts[0].indexOf('.') !== -1;
  const nsParts = parts[0].replace(/^module\:/, '').split(/[\/\.]/);
  const last = nsParts.length - 1;
  const importName = isNamed ?
    '_' + nsParts.slice(0, last).join('_') + '.' + nsParts[last] :
    '$' + nsParts.join('$');
  let line = nsParts[0];
  for (let i = 1, ii = nsParts.length; i < ii; ++i) {
    line += `.${nsParts[i]}`;
    namespaces[line] = (line in namespaces ? namespaces[line] : true) && i < ii - 1;
  }
  line += ` = ${importName};`;
  return line;
}


/**
 * Generate export code given a list symbol names.
 * @param {Array<Object>} symbols List of symbols.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Array<string>} imports List of all imports.
 * @return {string} Export code.
 */
function generateExports(symbols, namespaces, imports) {
  let blocks = [];
  symbols.forEach(function(symbol) {
    const name = symbol.name;
    if (name.indexOf('#') == -1) {
      const block = formatSymbolExport(name, namespaces);
      if (block !== blocks[blocks.length - 1]) {
        blocks.push(block);
      }
    }
  });
  const nsdefs = [];
  const ns = Object.keys(namespaces);
  for (let i = 0, ii = ns.length; i < ii; ++i) {
    if (namespaces[ns[i]]) {
      nsdefs.push(`${ns[i]} = {};`);
    }
  }
  console.assert(root, 'The root should be defined at this point');
  blocks = imports.concat(`\nvar ${root} = window['${root}'] = {};\n`, [...nsdefs, ...blocks].sort());
  blocks.push('');
  return blocks.join('\n');
}


/**
 * Generate the exports code.
 * @return {string} Resolves with the exports code.
 */
function main() {
  const symbols = getSymbols();
  const imports = getImports(symbols);
  return generateExports(symbols, {}, imports);
}


/**
 * If running this module directly, read the config file, call the main
 * function, and write the output file.
 */
if (require.main === module) {
  const code = main();
  const filepath = path.join('build', 'index.js');
  fs.writeFileSync(filepath, code);
}


/**
 * Export main function.
 */
module.exports = main;
