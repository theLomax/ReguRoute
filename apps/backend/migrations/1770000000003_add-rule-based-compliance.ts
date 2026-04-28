import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add rule_definition column for state-specific compliance rules
  pgm.addColumn('regulations', {
    rule_definition: {
      type: 'jsonb',
      comment: 'State-specific rule logic for equipment compliance checking (e.g., NY-compliant rifle definitions)',
    },
  });

  // Add index on rule_definition for efficient querying
  pgm.createIndex('regulations', ['rule_definition'], {
    method: 'gin',
    name: 'idx_regulations_rule_definition_gin',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('regulations', 'rule_definition');
}