const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;

async function WriteJson(outFile, doc) {
  await fsp.writeFile(outFile, JSON.stringify(doc));
}

async function WriteHtml(outFile, doc) {

  var header = "<!-- " + JSON.stringify(doc.DocumentInfo) + "  -->\n";
  return new Promise((resolve, reject) => {
    let stream = fs.createWriteStream(outFile, {encoding: 'utf8'});
    stream.write(header);
    stream.write(doc.DocumentBody.Html);
    stream.end();
    resolve(`${outFile} saved!`);
  

    //is this the correct way to return a promise upon stringify complete?
  });
}

function getDocumentWrier(type) {
  switch (type) {
    case "html":
      return {
        getFileName: baseName => baseName + ".html",
        writeFile: WriteHtml
      };
      break;
    case "json":
      return {
        getFileName: baseName => baseName + ".json",
        writeFile: WriteJson
      };
      break;

    default:
      console.error("Unknown writer type:  " + type);
      break;
  }
}

module.exports.getDocumentWrier = getDocumentWrier;
