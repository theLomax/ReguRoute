#!/usr/bin/env node

/**
 * ReguRoute Data Quality Checker
 * 
 * Automated script to check regulation data quality and identify issues
 * Run with: node scripts/check-data-quality.js
 */

import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'reguroute',
  password: 'your_password_here', // This should be set from environment
  port: 5432,
};

class DataQualityChecker {
  constructor() {
    this.client = new Client(dbConfig);
    this.issues = [];
    this.metrics = {};
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

  async checkStaleRegulations() {
    console.log('\n🔍 Checking for stale regulations...');
    
    const query = `
      SELECT 
        j.postal_code,
        j.name,
        r.category,
        r.last_verified,
        EXTRACT(days FROM (CURRENT_DATE - r.last_verified::date)) as days_since_verified,
        r.statutory_citation
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state' 
        AND r.last_verified IS NOT NULL
        AND r.last_verified < (CURRENT_DATE - INTERVAL '1 year')
      ORDER BY r.last_verified ASC;
    `;

    const result = await this.client.query(query);
    
    if (result.rows.length > 0) {
      console.log(`⚠️  Found ${result.rows.length} stale regulations:`);
      result.rows.forEach(row => {
        console.log(`   ${row.postal_code} - ${row.category}: ${row.days_since_verified} days old`);
        this.issues.push({
          type: 'stale_regulation',
          jurisdiction: row.postal_code,
          category: row.category,
          days_old: row.days_since_verified,
          severity: 'medium'
        });
      });
    } else {
      console.log('✅ No stale regulations found');
    }

    return result.rows.length;
  }

  async checkMissingData() {
    console.log('\n🔍 Checking for missing critical data...');
    
    // Check missing effective dates
    const missingDatesQuery = `
      SELECT 
        j.postal_code,
        j.name,
        r.category,
        r.statutory_citation
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state' AND r.effective_date IS NULL
      ORDER BY j.postal_code, r.category;
    `;

    const missingDates = await this.client.query(missingDatesQuery);
    
    if (missingDates.rows.length > 0) {
      console.log(`⚠️  Found ${missingDates.rows.length} regulations without effective dates:`);
      missingDates.rows.forEach(row => {
        console.log(`   ${row.postal_code} - ${row.category}`);
        this.issues.push({
          type: 'missing_effective_date',
          jurisdiction: row.postal_code,
          category: row.category,
          severity: 'low'
        });
      });
    } else {
      console.log('✅ All regulations have effective dates');
    }

    return missingDates.rows.length;
  }

  async checkGenericCitations() {
    console.log('\n🔍 Checking for generic citations...');
    
    const genericCitationsQuery = `
      SELECT 
        j.postal_code,
        j.name,
        r.category,
        r.statutory_citation
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state' 
        AND r.statutory_citation IN ('State law', 'Federal law', 'N/A')
      ORDER BY j.postal_code, r.category;
    `;

    const genericCitations = await this.client.query(genericCitationsQuery);
    
    if (genericCitations.rows.length > 0) {
      console.log(`⚠️  Found ${genericCitations.rows.length} regulations with generic citations:`);
      genericCitations.rows.forEach(row => {
        console.log(`   ${row.postal_code} - ${row.category}: "${row.statutory_citation}"`);
        this.issues.push({
          type: 'generic_citation',
          jurisdiction: row.postal_code,
          category: row.category,
          citation: row.statutory_citation,
          severity: 'low'
        });
      });
    } else {
      console.log('✅ All regulations have specific citations');
    }

    return genericCitations.rows.length;
  }

  async calculateMetrics() {
    console.log('\n📊 Calculating quality metrics...');
    
    // Total regulations
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state';
    `;
    const totalResult = await this.client.query(totalQuery);
    this.metrics.total_regulations = parseInt(totalResult.rows[0].count);

    // Regulations with recent verification (< 6 months)
    const recentQuery = `
      SELECT COUNT(*) as count 
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state'
        AND r.last_verified >= (CURRENT_DATE - INTERVAL '6 months');
    `;
    const recentResult = await this.client.query(recentQuery);
    this.metrics.recent_verifications = parseInt(recentResult.rows[0].count);

    // Regulations with effective dates
    const datedQuery = `
      SELECT COUNT(*) as count 
      FROM regulations r
      JOIN jurisdictions j ON r.jurisdiction_id = j.id
      WHERE j.type = 'state'
        AND r.effective_date IS NOT NULL;
    `;
    const datedResult = await this.client.query(datedQuery);
    this.metrics.with_effective_dates = parseInt(datedResult.rows[0].count);

    // Calculate percentages
    this.metrics.verification_freshness = Math.round((this.metrics.recent_verifications / this.metrics.total_regulations) * 100);
    this.metrics.effective_date_completeness = Math.round((this.metrics.with_effective_dates / this.metrics.total_regulations) * 100);

    console.log(`   Total regulations: ${this.metrics.total_regulations}`);
    console.log(`   Recent verifications: ${this.metrics.recent_verifications} (${this.metrics.verification_freshness}%)`);
    console.log(`   With effective dates: ${this.metrics.with_effective_dates} (${this.metrics.effective_date_completeness}%)`);
  }

  async generateReport() {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = join(__dirname, '..', 'analysis', `data-quality-${timestamp}.json`);
    
    const report = {
      generated_at: new Date().toISOString(),
      metrics: this.metrics,
      issues: this.issues,
      summary: {
        total_issues: this.issues.length,
        critical_issues: this.issues.filter(i => i.severity === 'critical').length,
        medium_issues: this.issues.filter(i => i.severity === 'medium').length,
        low_issues: this.issues.filter(i => i.severity === 'low').length,
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    return report;
  }

  async run() {
    console.log('🚀 Starting ReguRoute Data Quality Check...\n');
    
    try {
      await this.connect();
      
      // Run all checks
      await this.checkStaleRegulations();
      await this.checkMissingData();
      await this.checkGenericCitations();
      await this.calculateMetrics();
      
      // Generate report
      const report = await this.generateReport();
      
      // Summary
      console.log('\n📈 SUMMARY');
      console.log('=' .repeat(50));
      console.log(`Total Issues Found: ${report.summary.total_issues}`);
      console.log(`  Critical: ${report.summary.critical_issues}`);
      console.log(`  Medium: ${report.summary.medium_issues}`);
      console.log(`  Low: ${report.summary.low_issues}`);
      console.log(`\nData Quality Score: ${this.metrics.verification_freshness}% (based on verification freshness)`);
      
      if (report.summary.total_issues === 0) {
        console.log('\n🎉 Excellent! No data quality issues found.');
      } else {
        console.log(`\n⚠️  Found ${report.summary.total_issues} issues that should be addressed.`);
      }
      
    } catch (error) {
      console.error('❌ Error during quality check:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the checker
const checker = new DataQualityChecker();
checker.run().catch(console.error);