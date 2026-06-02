#!/usr/bin/env node
/**
 * Test script for ws-bridge and Google Flow extension
 * Tests:
 * 1. Extension connection status
 * 2. Image generation via Nano Banana model
 */

import http from 'http';

const BRIDGE_URL = 'http://localhost:1889';

// Helper function to send POST request
function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 1889,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper function to GET result
function getResult(commandId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 1889,
      path: `/result/${commandId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Poll for result
async function pollResult(commandId, maxAttempts = 30, interval = 3000) {
  console.log(`\n📡 Polling for result (ID: ${commandId})...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, interval));
    
    const result = await getResult(commandId);
    console.log(`   Attempt ${attempt}/${maxAttempts}: ${result.data.status || 'no status'}`);
    
    if (result.data.status === 'completed' && result.data.results) {
      return result.data;
    }
    
    if (result.data.status === 'failed') {
      return result.data;
    }
  }
  
  return { status: 'timeout' };
}

// Main test
async function runTest() {
  console.log('🧪 Testing ws-bridge and Google Flow Extension\n');
  
  // Test 1: Check connection
  console.log('1️⃣ Testing connection...');
  const testCommand = {
    id: 'test-' + Date.now(),
    action: 'ping'
  };
  
  try {
    const response = await postRequest('/', testCommand);
    console.log('   Bridge response:', response.statusCode);
    console.log('   Data:', response.data);
    
    if (response.data.error === 'Extension not connected') {
      console.log('❌ EXTENSION NOT CONNECTED');
      console.log('💡 Make sure:');
      console.log('   - Chrome extension "SlncTrZ_Everything-GenAI" is installed');
      console.log('   - Extension is connected to ws://localhost:1888');
      console.log('   - A Google Flow tab (labs.google.com/fx) is OPEN');
      return;
    }
    
    console.log('✅ Extension is connected');
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return;
  }
  
  // Test 2: Image generation
  console.log('\n2️⃣ Testing image generation...');
  const imageCommand = {
    id: 'img-' + Date.now(),
    action: 'execute',
    provider: 'flow',
    prompts: ['a cute cat'],
    images: [],
    config: {
      mode: 'image',
      model: 'Nano Banana Fast',
      size: '1K',
      ratio: '16:9'
    }
  };
  
  try {
    console.log('   Sending command:', imageCommand.id);
    console.log('   Model:', imageCommand.config.model);
    console.log('   Prompt:', imageCommand.prompts[0]);
    
    const response = await postRequest('/', imageCommand);
    console.log('   Command sent:', response.data.status);
    
    // Poll for result
    const result = await pollResult(imageCommand.id, 30, 3000);
    
    if (result.status === 'completed' && result.results) {
      console.log('✅ Image generation successful!');
      console.log('   Result:', result.results[0]);
    } else if (result.status === 'failed') {
      console.log('❌ Generation failed:', result.error);
    } else {
      console.log('⏱️ Timeout - generation took too long');
    }
  } catch (error) {
    console.log('❌ Image generation failed:', error.message);
  }
}

// Run the test
runTest().catch(console.error);