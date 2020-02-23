const path = require("path");
const fs = require("fs");
const exeDir = path.dirname(process.execPath);
const isExe = exeDir.endsWith("nodejs") ? false : true;
const executeDir = isExe ? path.dirname(process.execPath) : __dirname;
const configFile = path.join(executeDir, "config.json");

if (fs.existsSync(configFile)) {
  console.log(`Use config file: ${configFile}`);
}

const config = fs.existsSync(configFile)
  ? JSON.parse(fs.readFileSync(configFile, "utf8"))
  : { headless: true, pathToChromium: null, documentWriterType: "html" };

const subPathToChromium = isExe
  ? path.join(exeDir, "chromium")
  : path.join(__dirname, "node_modules", "\\puppeteer\\.local-chromium");
const pathToChromium = path.join(
  subPathToChromium,
  "win64-722234\\chrome-win\\chrome.exe"
);
function getRegistry() {
  return {
    headless: config.headless,
    executeDir: executeDir,
    isExe: isExe,
    pathToChromium: config.pathToChromium
      ? config.pathToChromium
      : pathToChromium,
    puppeteerExtraDir: path.join(executeDir, "puppeteer-extra"),
    puppeteerStealthPluginDir: path.join(
      executeDir,
      "puppeteer-extra-plugin-stealth"
    ),
    documentWriterType: config.documentWriterType
  };
}

module.exports.getRegistry = getRegistry;
