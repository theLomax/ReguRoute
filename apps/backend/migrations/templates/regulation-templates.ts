/**
 * Regulation templates for batch processing
 * These templates provide standardized structures for common regulation types
 */

export interface RegulationTemplate {
  category: string;
  is_restricted: boolean;
  restriction_level: number;
  permit_required?: boolean;
  magazine_capacity_limit?: number;
  transport_requirements?: Record<string, any>;
  notes: string;
}

// Constitutional Carry Template - No permit required for concealed carry
export const CONSTITUTIONAL_CARRY_TEMPLATE: RegulationTemplate = {
  category: 'concealed_carry',
  is_restricted: false,
  restriction_level: 1, // Very permissive
  permit_required: false,
  notes: 'Constitutional carry - no permit required for concealed carry by qualified individuals'
};

// Standard Vehicle Transport Template - FOPA compliance
export const STANDARD_VEHICLE_TRANSPORT_TEMPLATE: RegulationTemplate = {
  category: 'vehicle_carry',
  is_restricted: false,
  restriction_level: 2,
  transport_requirements: {
    must_be_unloaded: true,
    must_be_locked: false,
    separate_ammo: false,
    not_accessible: true,
    federal_fopa_applies: true
  },
  notes: 'Federal FOPA protections apply - firearms must be unloaded and not readily accessible'
};

// Permissive Magazine Capacity Template - No state restrictions
export const NO_MAGAZINE_LIMIT_TEMPLATE: RegulationTemplate = {
  category: 'magazine_capacity',
  is_restricted: false,
  restriction_level: 1,
  magazine_capacity_limit: undefined,
  notes: 'No state-level magazine capacity restrictions - federal law applies'
};

// Standard Open Carry Template - Generally permitted
export const OPEN_CARRY_PERMITTED_TEMPLATE: RegulationTemplate = {
  category: 'open_carry',
  is_restricted: false,
  restriction_level: 2,
  notes: 'Open carry generally permitted - local restrictions may apply'
};

// No Registration Template - No state registration requirements
export const NO_REGISTRATION_TEMPLATE: RegulationTemplate = {
  category: 'registration',
  is_restricted: false,
  restriction_level: 1,
  notes: 'No state-level firearm registration requirements'
};