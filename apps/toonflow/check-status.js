#!/usr/bin/env node
/**
 * Quick test - Check extension status and Google Flow tab
 */

import http from 'http';

function getStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 1889,
      path: '/result',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking extension and bridge status...\n');
  
  try {
    const status = await getStatus();
    console.log('Current status:', JSON.stringify(status, null, 2));
    
    if (status.error?.includes('not connected')) {
      console.log('\n❌ Extension NOT connected');
      console.log('💡 Install and enable "SlncTrZ_Everything-GenAI" extension');
    } else if (status.status === 'no_result') {
      console.log('\n✅ Extension is connected');
      console.log('ℹ️ No recent results found');
      console.log('\n📋 REQUIREMENTS:');
      console.log('1. Chrome extension "SlncTrZ_Everything-GenAI" must be installed');
      console.log('2. Extension must be connected to ws://localhost:1888');
      console.log('3. A Google Flow tab (labs.google.com/fx) must be OPEN');
      console.log('\n⚠️ The timeout suggests Google Flow tab is NOT open.');
      console.log('💡 Open labs.google.com/fx in Chrome and try again.');
    } else {
      console.log('\n✅ Last result:', status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();