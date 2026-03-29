import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const pdfPath = 'c:\\Users\\prave\\Downloads\\wander-sphere-travel-main\\wander-sphere-travel-main\\src\\assets\\flight api doc.pdf';
let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('flight_api_doc_parsed.txt', data.text);
    console.log('PDF parsed successfully. Total characters:', data.text.length);
}).catch(function(err) {
    console.error('Error parsing PDF:', err);
});
