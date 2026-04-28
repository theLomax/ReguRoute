#!/usr/bin/env node

/**
 * Test Interstate Reciprocity Service
 * 
 * Tests the reciprocity analysis functions with sample data
 * Run with: node scripts/test-reciprocity.js
 */

import { Client } from 'pg';
import { 
  analyzeRouteReciprocity, 
  checkReciprocity, 
  getPermitTypesForState,
  getReciprocityMap,
  updateReciprocity
} from '../apps/backend/src/services/reciprocity.js';

// Database configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'reguroute',
  password: 'your_password_here',
  port: 5432,
};

class ReciprocityTester {
  constructor() {
    this.client = new Client(dbConfig);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('✅ Database connection closed');
  }

  async testBasicReciprocity() {
    console.log('\n🔍 Testing basic reciprocity lookup...');
    
    try {
      // Test Texas permit in Florida
      const txToFl = await checkReciprocity(this.client, 'TX', 'FL');
      console.log('TX permit in FL:', txToFl ? `${txToFl.recognition_type} recognition` : 'No data');
      
      // Test Florida permit in Texas  
      const flToTx = await checkReciprocity(this.client, 'FL', 'TX');
      console.log('FL permit in TX:', flToTx ? `${flToTx.recognition_type} recognition` : 'No data');
      
      // Test Texas permit in California (should be none)
      const txToCa = await checkReciprocity(this.client, 'TX', 'CA');
      console.log('TX permit in CA:', txToCa ? `${txToCa.recognition_type} recognition` : 'No data');
      
    } catch (error) {
      console.error('❌ Error testing basic reciprocity:', error.message);
    }
  }

  async testPermitTypes() {
    console.log('\n🔍 Testing permit types lookup...');
    
    try {
      const txPermits = await getPermitTypesForState(this.client, 'TX');
      console.log(`Texas permit types: ${txPermits.length} found`);
      if (txPermits.length > 0) {
        console.log('  -', txPermits[0].permit_name, `(${txPermits[0].permit_class})`);
      }
      
      const utPermits = await getPermitTypesForState(this.client, 'UT');
      console.log(`Utah permit types: ${utPermits.length} found`);
      if (utPermits.length > 0) {
        console.log('  -', utPermits[0].permit_name, `(${utPermits[0].permit_class})`);
      }
      
    } catch (error) {
      console.error('❌ Error testing permit types:', error.message);
    }
  }

  async testRouteAnalysis() {
    console.log('\n🔍 Testing route reciprocity analysis...');
    
    try {
      // Test Texas permit holder traveling through multiple states
      const travelStates = ['TX', 'OK', 'AR', 'TN', 'KY', 'OH', 'PA'];
      const analysis = await analyzeRouteReciprocity(this.client, 'TX', travelStates);
      
      console.log(`\nRoute Analysis for TX permit holder:`);
      console.log(`Travel states: ${travelStates.join(' → ')}`);
      console.log(`\nRecognition Summary:`);
      console.log(`  ✅ Recognized: ${analysis.recognition_summary.recognized.length} states`);
      console.log(`  ⚠️  Partial: ${analysis.recognition_summary.partial_recognition.length} states`);
      console.log(`  👥 Resident-only: ${analysis.recognition_summary.resident_only.length} states`);
      console.log(`  ❌ Not recognized: ${analysis.recognition_summary.not_recognized.length} states`);
      
      console.log(`\nRecommendations:`);
      analysis.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
      
      if (analysis.detailed_analysis.length > 0) {
        console.log(`\nDetailed Analysis:`);
        analysis.detailed_analysis.forEach(detail => {
          const icon = detail.recognition_type === 'full' ? '✅' : 
                      detail.recognition_type === 'partial' ? '⚠️' : 
                      detail.recognition_type === 'resident_only' ? '👥' : '❌';
          console.log(`  ${icon} ${detail.state}: ${detail.recommendation}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing route analysis:', error.message);
    }
  }

  async testReciprocityMap() {
    console.log('\n🔍 Testing reciprocity map...');
    
    try {
      const txMap = await getReciprocityMap(this.client, 'TX');
      console.log(`Texas permit recognized in ${txMap.length} states:`);
      
      const recognitionCounts = {
        full: txMap.filter(r => r.recognition_type === 'full').length,
        partial: txMap.filter(r => r.recognition_type === 'partial').length,
        resident_only: txMap.filter(r => r.recognition_type === 'resident_only').length,
        none: txMap.filter(r => r.recognition_type === 'none').length
      };
      
      console.log(`  Full recognition: ${recognitionCounts.full} states`);
      console.log(`  Partial recognition: ${recognitionCounts.partial} states`);
      console.log(`  Resident-only: ${recognitionCounts.resident_only} states`);
      console.log(`  No recognition: ${recognitionCounts.none} states`);
      
      // Show a few examples
      const fullRecognition = txMap.filter(r => r.recognition_type === 'full').slice(0, 5);
      if (fullRecognition.length > 0) {
        console.log(`\nFull recognition examples:`);
        fullRecognition.forEach(state => {
          console.log(`  • ${state.state_name} (${state.state})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing reciprocity map:', error.message);
    }
  }

  async addSampleReciprocity() {
    console.log('\n🔍 Adding sample reciprocity data...');
    
    try {
      // Add Utah enhanced permit recognition in Virginia
      await updateReciprocity(
        this.client,
        'UT',
        'VA',
        'full',
        { enhanced: true, standard: false },
        { training_verification: 'required' },
        'Virginia recognizes Utah Enhanced permits due to comprehensive training requirements',
        '2019-05-01'
      );
      console.log('✅ Added UT Enhanced → VA recognition');
      
      // Verify it was added
      const utToVa = await checkReciprocity(this.client, 'UT', 'VA');
      console.log('Verification:', utToVa ? `${utToVa.recognition_type} recognition` : 'No data found');
      
    } catch (error) {
      console.error('❌ Error adding sample reciprocity:', error.message);
    }
  }

  async run() {
    console.log('🚀 Starting Interstate Reciprocity Tests...\n');
    
    try {
      await this.connect();
      
      // Run all tests
      await this.testBasicReciprocity();
      await this.testPermitTypes();
      await this.testRouteAnalysis();
      await this.testReciprocityMap();
      await this.addSampleReciprocity();
      
      console.log('\n🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during testing:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the tests
const tester = new ReciprocityTester();
tester.run().catch(console.error);