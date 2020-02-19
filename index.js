const path = require("path");
var crypto = require("crypto");
const fsp = require("fs").promises;
const exeDir = path.dirname(process.execPath);
const puppeteerExtra = path.join(exeDir, "puppeteer-extra");
const puppeteerStealthPlugin = path.join(exeDir, "puppeteer-extra-plugin-stealth");
const pathToChromium =  path.join(exeDir, "chromium\\win64-722234\\chrome-win\\chrome.exe");
const puppeteer = require(puppeteerExtra);
const StealthPlugin = require(puppeteerStealthPlugin);
puppeteer.use(StealthPlugin());


const urlToProcess = process.argv[2];
console.log(`Work-dir: ${exeDir}`);
console.log(`Url to process: ${urlToProcess}`);
const uriIn = new URL(urlToProcess);
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: pathToChromium
  });

  var doc = {
    DocumentInfo: { UrlIn: "", UrlOut: "" },
    DocumentBody: { Html: "" }
  };

  const page = await browser.newPage();
  await page.goto(uriIn);
  await page.waitFor(2000);
  const html = await page.content();
  const currentUrl = page.url();
  const uriOut = new URL(currentUrl);
  doc.DocumentBody.Html = html;
  doc.DocumentInfo.UrlIn = uriIn;
  doc.DocumentInfo.UrlOut = uriOut;
  await browser.close();
  var hash = crypto
    .createHash("md5")
    .update(uriIn.href)
    .digest("hex");
  const fileName = uriIn.host + "_" + hash + ".json";
  console.log(`File to save: ${fileName}`);
  await fsp.writeFile(fileName, JSON.stringify(doc));
  console.log(`All done`);
})();
