import http from 'http';

const data = JSON.stringify({ action: 'ping' });
const req = http.request({
  hostname: '192.168.1.227',
  port: 1889,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Response:', body);
    // Test GET result
    http.get('http://192.168.1.227:1889/result', (r2) => {
      let b2 = '';
      r2.on('data', c => b2 += c);
      r2.on('end', () => console.log('Result:', b2));
    });
  });
});
req.write(data);
req.end();
