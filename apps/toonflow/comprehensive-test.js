#!/usr/bin/env node
/**
 * Comprehensive test for Google Flow image generation
 */

import http from 'http';

const HTTP_PORT = 1889;

function postRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/',
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
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
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

function getResult(commandId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: `/result/${commandId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function pollForResult(commandId, maxWait = 60000) {
  const startTime = Date.now();
  const checkInterval = 2000;
  
  console.log(`   Polling for result (max ${maxWait/1000}s)...`);
  
  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, checkInterval));
    
    const result = await getResult(commandId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`   [${elapsed}s] Status: ${result.data.status || 'checking'}`);
    
    if (result.data.status === 'completed') {
      if (result.data.results && result.data.results.length > 0 && result.data.results[0]) {
        console.log('   ✅ Got valid result');
        return result.data;
      } else {
        console.log('   ⚠️ Result completed but contains null/empty');
        console.log('   Full response:', JSON.stringify(result.data, null, 2));
        return result.data;
      }
    }
    
    if (result.data.status === 'failed') {
      console.log('   ❌ Generation failed');
      console.log('   Error:', result.data.error || 'Unknown error');
      return result.data;
    }
  }
  
  console.log('   ⏱️ Timeout reached');
  return null;
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE GOOGLE FLOW TEST\n');
  console.log('═'.repeat(50));
  
  // Test 1: Connection check
  console.log('\n1️⃣ CONNECTION CHECK');
  console.log('-'.repeat(30));
  
  const testId = 'ping-' + Date.now();
  const testCommand = {
    id: testId,
    action: 'execute',
    provider: 'flow',
    prompts: ['test'],
    config: { mode: 'image', model: 'Nano Banana Fast' }
  };
  
  try {
    const response = await postRequest(testCommand);
    console.log('   Status Code:', response.statusCode);
    console.log('   Response:', response.data);
    
    if (response.data.error === 'Extension not connected') {
      console.log('\n   ❌ EXTENSION NOT CONNECTED');
      console.log('   💡 Install "SlncTrZ_Everything-GenAI" Chrome extension');
      console.log('   💡 Make sure it connects to ws://localhost:1888');
      return;
    }
    
    console.log('   ✅ Extension is connected to bridge');
  } catch (error) {
    console.log('   ❌ Bridge connection failed:', error.message);
    return;
  }
  
  // Test 2: Image generation
  console.log('\n2️⃣ IMAGE GENERATION TEST');
  console.log('-'.repeat(30));
  
  const imgId = 'test-' + Date.now();
  const imgCommand = {
    id: imgId,
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
  
  console.log('   Command ID:', imgId);
  console.log('   Model:', imgCommand.config.model);
  console.log('   Prompt:', imgCommand.prompts[0]);
  
  try {
    const response = await postRequest(imgCommand);
    console.log('   Command sent:', response.data.status);
    
    if (response.data.error) {
      console.log('   ❌ Error sending command:', response.data.error);
      return;
    }
    
    const result = await pollForResult(imgId, 60000);
    
    if (result && result.status === 'completed') {
      if (result.results && result.results[0]) {
        console.log('\n   ✅ IMAGE GENERATION SUCCESSFUL!');
        console.log('   URL:', result.results[0]);
      } else {
        console.log('\n   ⚠️ GENERATION COMPLETED BUT RETURNED NULL');
        console.log('   This usually means:');
        console.log('   1. Google Flow tab (labs.google.com/fx) is NOT open');
        console.log('   2. The tab is not in focus or has timed out');
        console.log('   3. Extension permissions issue');
      }
    } else if (result && result.status === 'failed') {
      console.log('\n   ❌ GENERATION FAILED');
      console.log('   Error:', result.error);
    } else {
      console.log('\n   ⏱️ TIMEOUT - No response received');
      console.log('   This typically means Google Flow tab is not open');
    }
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n📋 REQUIREMENTS:');
  console.log('   ✅ ws-bridge server running (port 1888/1889)');
  console.log('   ✅ Extension connected');
  console.log('   ⚠️  Google Flow tab MUST be open (labs.google.com/fx)');
  console.log('\n💡 If generation fails, open labs.google.com/fx in Chrome');
}

runComprehensiveTest().catch(console.error);