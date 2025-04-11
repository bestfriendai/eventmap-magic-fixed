/**
 * API Tester Utility
 * 
 * This script tests all API connections used in the application.
 * It can be run from the command line or imported and used programmatically.
 */

import { searchTicketmasterEvents } from '../services/ticketmaster';
import { searchEventbriteRapidAPI } from '../services/eventbrite-rapidapi';
import { searchRapidAPIEvents } from '../services/rapidapi-events';
import { searchGoogleEvents } from '../services/google-events';
import { searchLocations } from '../services/mapbox';

// Default test location (San Francisco)
const DEFAULT_TEST_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  name: 'San Francisco'
};

// Test parameters
const TEST_RADIUS = 10;

import { Event } from '../types';
import { Suggestion } from '../services/mapbox';

interface TestResult {
  api: string;
  success: boolean;
  responseTime: number;
  eventCount?: number;
  error?: string;
  sampleData?: unknown;
}

type ApiFunction = (params: {
  latitude: number;
  longitude: number;
  radius: number;
}) => Promise<Event[] | Suggestion[]>;

interface ApiParams {
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Test a single API
 */
async function testAPI(
  apiName: string,
  apiFunction: ApiFunction,
  params: ApiParams
): Promise<TestResult> {
  console.log(`Testing ${apiName} API...`);
  const startTime = Date.now();
  
  try {
    const results = await apiFunction(params);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ ${apiName} API test successful`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Events found: ${results.length}`);
    
    if (results.length > 0) {
      // Check if it's an Event before accessing title
      if ('title' in results[0]) {
        console.log(`   Sample event: ${results[0].title}`);
      } else if ('place_name' in results[0]) {
        console.log(`   Sample location: ${results[0].place_name}`);
      }
    }
    
    return {
      api: apiName,
      success: true,
      responseTime,
      eventCount: results.length,
      sampleData: results.length > 0 ? results[0] : undefined
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.error(`❌ ${apiName} API test failed`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Response time: ${responseTime}ms`);
    
    return {
      api: apiName,
      success: false,
      responseTime,
      error: error.message
    };
  }
}

/**
 * Test the Mapbox API
 */
async function testMapboxAPI(query: string = 'San Francisco'): Promise<TestResult> {
  console.log(`Testing Mapbox API with query: ${query}...`);
  const startTime = Date.now();
  
  try {
    const results = await searchLocations(query);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Mapbox API test successful`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Locations found: ${results.length}`);
    
    if (results.length > 0) {
      console.log(`   Sample location: ${results[0].place_name}`);
    }
    
    return {
      api: 'Mapbox',
      success: true,
      responseTime,
      eventCount: results.length,
      sampleData: results.length > 0 ? results[0] : undefined
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.error(`❌ Mapbox API test failed`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Response time: ${responseTime}ms`);
    
    return {
      api: 'Mapbox',
      success: false,
      responseTime,
      error: error.message
    };
  }
}

/**
 * Run all API tests
 */
export async function runAllTests(
  location = DEFAULT_TEST_LOCATION,
  radius = TEST_RADIUS
): Promise<TestResult[]> {
  console.log('=== Starting API Tests ===');
  console.log(`Test location: ${location.name} (${location.latitude}, ${location.longitude})`);
  console.log(`Test radius: ${radius} miles`);
  console.log('========================');
  
  const testParams = {
    latitude: location.latitude,
    longitude: location.longitude,
    radius
  };
  
  const results: TestResult[] = [];
  
  // Test Mapbox API
  results.push(await testMapboxAPI(location.name));
  
  // Test Ticketmaster API
  results.push(await testAPI('Ticketmaster', searchTicketmasterEvents, testParams));
  
  // Test Eventbrite API
  results.push(await testAPI('Eventbrite', searchEventbriteRapidAPI, testParams));
  
  // Test RapidAPI Events
  results.push(await testAPI('RapidAPI', searchRapidAPIEvents, testParams));
  
  // Test Google Events
  results.push(await testAPI('Google', searchGoogleEvents, testParams));
  
  // Print summary
  console.log('=== API Test Summary ===');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.api} | ${result.responseTime}ms | ${result.eventCount || 0} events`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Overall: ${successCount}/${results.length} APIs working`);
  
  return results;
}

// If this script is run directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
