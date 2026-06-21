const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve('android/app/src/main/assets/index.android.bundle');
console.log('Reading bundle from:', bundlePath);

let bundle = fs.readFileSync(bundlePath, 'utf8');
const originalSize = bundle.length;

// The crash is: import Config from 'react-native-config'; then Config.API_URL
// In minified Hermes bytecode this is already compiled, but the bundle is plain JS.
// Let's find the pattern where Config (the default export of react-native-config) is used.

// Strategy: Find the react-native-config module definition and make it return a safe empty object
// instead of null when the native module isn't available.

// Pattern 1: Look for the module that imports react-native-config and accesses Config.API_URL
// In the minified bundle, the env.ts module will look something like:
// var _reactNativeConfig = ... require(...) ... ; ... _reactNativeConfig.default.API_URL ...
// or: var Config = ... ; Config.API_URL

// Let's search for the API_URL and localhost patterns to find the env config module
const patterns = [
  // Match: Config.API_URL||'http://localhost:8787' (old pattern before our fix)
  { find: /\.API_URL\|\|'http:\/\/localhost:8787'/g, replace: ".API_URL||'http://54.91.165.108'" },
  { find: /\.DELL_URL\|\|'http:\/\/localhost:9182'/g, replace: ".DELL_URL||'http://54.91.165.108'" },
  // Match: Config.API_URL||"http://localhost:8787"
  { find: /\.API_URL\|\|"http:\/\/localhost:8787"/g, replace: '.API_URL||"http://54.91.165.108"' },
  { find: /\.DELL_URL\|\|"http:\/\/localhost:9182"/g, replace: '.DELL_URL||"http://54.91.165.108"' },
];

let patchCount = 0;
for (const p of patterns) {
  const matches = bundle.match(p.find);
  if (matches) {
    console.log(`Found ${matches.length} match(es) for: ${p.find}`);
    bundle = bundle.replace(p.find, p.replace);
    patchCount += matches.length;
  }
}

// Now the critical fix: make the Config import null-safe
// In the minified bundle, react-native-config's default export becomes something like:
// var n = r(d[0]).default  (where r(d[0]) is the react-native-config module)
// We need to find where this module is defined and make it safe.

// Strategy: Find the react-native-config module and wrap its NativeModules access.
// The module typically does: NativeModules.ReactNativeConfig or NativeModules.RNConfig
// and if not found returns null.

// Alternative: Find all places where .getConfig or .API_URL is called on Config
// and add null safety.

// Most reliable approach: Find the react-native-config module's getConfig usage
// The error says "Cannot read property 'getConfig' of null"
// This means the native module lookup returns null.

// Let's find and patch the NativeModules.ReactNativeConfig or similar
const nativeModulePatterns = [
  // Pattern: NativeModules.ReactNativeConfig (minified could be various forms)
  { 
    find: /NativeModules\.ReactNativeConfig/g, 
    replace: '(NativeModules.ReactNativeConfig||{getConfig:function(){return{}}})'
  },
  {
    find: /NativeModules\.RNConfig/g,
    replace: '(NativeModules.RNConfig||{getConfig:function(){return{}}})'
  },
];

for (const p of nativeModulePatterns) {
  const matches = bundle.match(p.find);
  if (matches) {
    console.log(`Found ${matches.length} match(es) for: ${p.find}`);
    bundle = bundle.replace(p.find, p.replace);
    patchCount += matches.length;
  }
}

// Also search for the .getConfig pattern more broadly
const getConfigMatch = bundle.match(/\.getConfig\b/g);
console.log(`Found ${getConfigMatch ? getConfigMatch.length : 0} .getConfig occurrences`);

// Search for 'localhost:8787' to confirm old URLs
const localhostMatch = bundle.match(/localhost:8787/g);
console.log(`Remaining localhost:8787 references: ${localhostMatch ? localhostMatch.length : 0}`);

// Search for 'localhost:9182'
const localhostMatch2 = bundle.match(/localhost:9182/g);
console.log(`Remaining localhost:9182 references: ${localhostMatch2 ? localhostMatch2.length : 0}`);

// Search for our AWS IP to confirm patches
const awsMatch = bundle.match(/54\.91\.165\.108/g);
console.log(`AWS IP references: ${awsMatch ? awsMatch.length : 0}`);

console.log(`\nTotal patches applied: ${patchCount}`);
console.log(`Bundle size: ${originalSize} -> ${bundle.length}`);

fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Bundle patched and saved!');
