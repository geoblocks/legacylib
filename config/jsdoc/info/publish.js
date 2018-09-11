/**
 * @fileoverview Generates JSON output based on exportable symbols (those with
 * an api tag) and boolean defines (with a define tag and a default value).
 */
const assert = require('assert');
const path = require('path');


/**
 * Publish hook for the JSDoc template.  Writes to JSON stdout.
 * @param {function} data The root of the Taffy DB containing doclet records.
 * @param {Object} opts Options.
 * @return {Promise} A promise that resolves when writing is complete.
 */
exports.publish = function(data, opts) {

  // get all doclets with the "api" property or define (excluding events)
  const docs = data(function() {
    return this.api; // do not use arrow function here (this should be unbounded)
  }).get();

  const symbols = [];
  const symbolsByName = {};
  docs.filter(doc => doc.api).forEach(function(doc) {
    const symbol = {
      name: doc.longname,
      kind: doc.kind,
      path: path.join(doc.meta.path, doc.meta.filename) + ':' + doc.meta.lineno
    };

    const existingSymbol = symbolsByName[symbol.name];
    if (existingSymbol) {
      const idx = symbols.indexOf(existingSymbol);
      symbols.splice(idx, 1);
    }
    symbols.push(symbol);
    symbolsByName[symbol.name] = symbol;
  });

  return new Promise(function(resolve, reject) {
    process.stdout.write(
      JSON.stringify({
        symbols: symbols
      }, null, 2));
  });

};
