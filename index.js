const path = require("path");
const crypto = require("crypto");
const reg = require("./registryManager").getRegistry();
const args = require("yargs").argv;
const fs = require("fs");
const fsp = require("fs").promises;

const puppeteer = reg.isExe
  ? require(reg.puppeteerExtraDir)
  : require("puppeteer-extra");
const StealthPlugin = reg.isExe
  ? require(reg.puppeteerStealthPluginDir)
  : require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const writerObj = require("./documentWriter").getDocumentWrier(
  reg.documentWriterType
);

async function processUrls(urlsAll, outDir, overrideResults) {
  const browser = await puppeteer.launch({
    headless: reg.headless,
    executablePath: reg.pathToChromium
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
      var hash = crypto
        .createHash("md5")
        .update(uriIn.href)
        .digest("hex");

      const fileName = writerObj.getFileName(uriIn.host + "_" + hash);
      const outFile =
        (!outDir || outDir == undefined) == false && fs.existsSync(outDir)
          ? path.join(outDir, fileName)
          : fileName;

      if (fs.existsSync(outFile) && overrideResults != true) {
        console.log(`File: ${outFile} exists. Skipping ...`);
        continue;
      }

      await page.goto(uriIn);
      await page.waitFor(2000);
      await page.waitForSelector(".cf-browser-verification", {
        hidden: true,
        timeout: 30000
      });
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
      await writerObj.writeFile(outFile, doc);
      // await fsp.writeFile(outFile, JSON.stringify(doc));
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

  var r1 = await tryReadFile(pathIn);
  items.push(...r1);
  return items.filter(s => (!s || s == undefined) == false).map(s => s.trim());
}

(async () => {
  var items = [];
  var fullPath = path.resolve(args.urlsFile);
  if (fs.existsSync(fullPath)) {
    console.log(`File with urls: ${fullPath}`);
    var r1 = await getUrls(fullPath);
    items.push(...r1);
  } else {
    items.push(args._[0]);
  }

  console.log(
    `Overwrite existing files: ${args.overrideResults != true ? false : true}`
  );

  await processUrls(items, args.outDir, args.overrideResults);
})();
