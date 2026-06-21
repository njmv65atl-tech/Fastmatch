const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve('android/app/src/main/assets/index.android.bundle');
let bundle = fs.readFileSync(bundlePath, 'utf8');

const loggerCode = `
var _originalFetch = global.fetch;
global.fetch = function() {
  var args = Array.prototype.slice.call(arguments);
  console.log("🚨 FETCH URL: ", args[0]);
  if (args[1]) console.log("🚨 FETCH OPTIONS: ", JSON.stringify(args[1]));
  return _originalFetch.apply(this, args);
};
`;

if (!bundle.includes("🚨 FETCH URL")) {
  fs.writeFileSync(bundlePath, loggerCode + bundle, 'utf8');
  console.log("Fetch logger injected successfully!");
} else {
  console.log("Fetch logger already present.");
}
