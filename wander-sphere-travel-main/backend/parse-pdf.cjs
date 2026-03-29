const { PdfReader } = require('pdfreader');
const fs = require('fs');

const pdfPath = 'c:\\Users\\prave\\Downloads\\wander-sphere-travel-main\\wander-sphere-travel-main\\src\\assets\\flight api doc.pdf';
let allText = '';

new PdfReader().parseFileItems(pdfPath, (err, item) => {
  if (err) console.error(err);
  else if (!item) {
    fs.writeFileSync('flight_api_doc_parsed.txt', allText);
    console.log('PDF parsed successfully.');
  } else if (item.text) {
    allText += item.text + '\n';
  }
});
