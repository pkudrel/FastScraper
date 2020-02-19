const path = require("path");
const crypto = require("crypto");
const args = require("yargs").argv;
const fs = require("fs");
const fsp = require("fs").promises;
const exeDir = path.dirname(process.execPath);
const isExe = exeDir.endsWith("nodejs") ? false : true;
console.log(`exeDir: ${exeDir}`);

const puppeteerExtra = path.join(exeDir, "puppeteer-extra");
const puppeteerStealthPlugin = path.join(
  exeDir,
  "puppeteer-extra-plugin-stealth"
);
const subPathToChromium = isExe
  ? path.join(exeDir, "chromium")
  : path.join(__dirname, "node_modules", "\\puppeteer\\.local-chromium");
console.log(`subPathToChromium: ${subPathToChromium}`);
const pathToChromium = path.join(
  subPathToChromium,
  "win64-722234\\chrome-win\\chrome.exe"
);
console.log(`pathToChromium: ${pathToChromium}`);
const puppeteer = isExe ? require(puppeteerExtra) : require("puppeteer-extra");
const StealthPlugin = isExe
  ? require(puppeteerStealthPlugin)
  : require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// const urlToProcess = process.argv[2];
// console.log(`Work-dir: ${exeDir}`);
// console.log(`Url to process: ${urlToProcess}`);
// const uriIn = new URL(urlToProcess);

async function processUrls(urlsAll, outDir) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: pathToChromium
  });
  var i = 0;
  var urls1 = urlsAll
    .filter(s => (!s || s == undefined) == false)
    .map(s => s.trim());

  var urls2 = urls1.filter((item, pos) => {
    return urls1.indexOf(item) == pos;
  });

  var len = urls2.length;
  const page = await browser.newPage();

  for (const urlToProcess of urls2) {
    console.log(`[${++i}/${len}] Processing: ${urlToProcess}`);

    try {
      const uriIn = new URL(urlToProcess);
      await page.goto(uriIn);
      await page.waitFor(2000);
      const html = await page.content();
      const currentUrl = page.url();
      const uriOut = new URL(currentUrl);
      var doc = {
        DocumentInfo: { UrlIn: "", UrlOut: "" },
        DocumentBody: { Html: "" }
      };

      doc.DocumentBody.Html = html;
      doc.DocumentInfo.UrlIn = uriIn;
      doc.DocumentInfo.UrlOut = uriOut;

      var hash = crypto
        .createHash("md5")
        .update(uriIn.href)
        .digest("hex");

      const fileName = uriIn.host + "_" + hash + ".json";
      const outFile =
        (!outDir || outDir == undefined) == false && fs.existsSync(outDir)
          ? path.join(outDir, fileName)
          : fileName;
      await fsp.writeFile(outFile, JSON.stringify(doc));
      console.log(`File to save: ${outFile}`);
    } catch (error) {
      console.log(`Problem with url: ${urlToProcess}; Error: ${error}`);
    }

    //
  }

  await browser.close();
}

async function getUrls(pathIn) {
  async function tryReadFile(pathLocal) {
    var res = [];
    try {
      if (fs.existsSync(pathLocal)) {
        const data = await fsp.readFile(pathLocal);
        console.log(`data: ${data}`);
        var arr1 = data.toString().split("\n");
        res.push(...arr1);
      }
    } catch (error) {
      console.log(`Problem with file: ${pathLocal}`);
    }
    return res;
  }

  var items = [];
  if (pathIn == undefined) return items;
  var p1 = path.join(__dirname, pathIn);
  var r1 = await tryReadFile(p1);
  items.push(...r1);
  return items.filter(s => (!s || s == undefined) == false).map(s => s.trim());
}

(async () => {
  var items = [];
  var r1 = await getUrls(args.urlsFile);

  items.push(...r1);
  items.push(args._[0]);
  console.log(`data: ${args.urlsFile}`);
  console.log(`data: ${args.outDir}`);
  console.log(`data: ${args._[0]}`);

  await processUrls(items, args.outDir);
})();
