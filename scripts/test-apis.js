#!/usr/bin/env node

/**
 * API Test Script
 * 
 * This script tests all API connections used in the application.
 * Run with: node scripts/test-apis.js
 * 
 * Optional arguments:
 * --location=lat,lng (e.g., --location=37.7749,-122.4194)
 * --name=LocationName (e.g., --name="San Francisco")
 * --radius=10 (radius in miles)
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register ts-node to handle TypeScript files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    esModuleInterop: true
  }
});

// Import the API tester
const apiTesterPath = resolve(__dirname, '../src/utils/api-tester.ts');
const { runAllTests } = require(apiTesterPath);

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};

args.forEach(arg => {
  if (arg.startsWith('--location=')) {
    const [lat, lng] = arg.replace('--location=', '').split(',').map(Number);
    params.latitude = lat;
    params.longitude = lng;
  } else if (arg.startsWith('--name=')) {
    params.name = arg.replace('--name=', '');
  } else if (arg.startsWith('--radius=')) {
    params.radius = Number(arg.replace('--radius=', ''));
  }
});

// Default location if not provided
const location = {
  latitude: params.latitude || 37.7749,
  longitude: params.longitude || -122.4194,
  name: params.name || 'San Francisco'
};

// Run the tests
runAllTests(location, params.radius || 10)
  .then(results => {
    // Exit with appropriate code based on test results
    const failedTests = results.filter(r => !r.success).length;
    process.exit(failedTests > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Error running API tests:', error);
    process.exit(1);
  });
