import fs from 'fs';
import https from 'https';
import path from 'path';

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error('Usage: node scripts/export-drawio-png.mjs <input.drawio> <output.png>');
  process.exit(1);
}

const xml = fs.readFileSync(input, 'utf8');
const body = new URLSearchParams({ format: 'png', xml }).toString();

const hostname = process.env.DRAWIO_EXPORT_HOST ?? 'exp-pdf.draw.io';

const req = https.request(
  {
    hostname,
    path: '/ImageExport4/export',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const out = Buffer.concat(chunks);
      if (res.statusCode !== 200) {
        console.error(`Export failed: HTTP ${res.statusCode}`);
        console.error(out.toString('utf8').slice(0, 500));
        process.exit(1);
      }
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, out);
      console.log(`Exported ${output} (${out.length} bytes)`);
    });
  },
);

req.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});

req.write(body, 'utf8');
req.end();
