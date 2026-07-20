const fs = require('fs');
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require('pdf-parse');

async function test() {
  try {
    const dataBuffer = fs.readFileSync('data/pdfs/SEC_Marketing_Rule_IA-5626.pdf');
    const parser = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    const data = await parser(dataBuffer);
    console.log("Success, length:", data.text.length);
  } catch (e) {
    console.error("PDF Error:", e);
  }
}
test();
