pkg --out-path dist -t  node12-win-x64 .
Copy-Item .\node_modules\puppeteer-extra -destination dist -recurse -Force
Copy-Item .\node_modules\puppeteer-extra-plugin-stealth -destination dist -recurse -Force
mkdir dist\chromium -Force
Copy-Item .\node_modules\puppeteer\.local-chromium\* -destination dist\chromium -recurse -Force

