-- Batch insert constitutional carry states (Group 1)

-- Wyoming
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'WY'), 'concealed_carry', false, 1, false, 'Wyo. Stat. § 6-8-104', 'Permitless carry for Wyoming residents age 21+. Non-residents need permits', '2011-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- Kansas  
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'KS'), 'concealed_carry', false, 1, false, 'K.S.A. § 21-6302', 'Constitutional carry for age 21+. Must be legally eligible to possess firearm', '2015-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- Maine
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'ME'), 'concealed_carry', false, 1, false, '17-A M.R.S. § 1052', 'Permitless carry for age 21+. Age 18+ with military service or completion of safety course', '2015-10-15', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- Idaho
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'ID'), 'concealed_carry', false, 1, false, 'Idaho Code § 18-3302', 'Constitutional carry for residents age 18+. Enhanced permits available for reciprocity', '2016-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- Mississippi
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'MS'), 'concealed_carry', false, 1, false, 'Miss. Code § 45-9-101', 'Permitless carry for residents age 18+. Enhanced permits available', '2016-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- West Virginia  
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'WV'), 'concealed_carry', false, 1, false, 'W. Va. Code § 61-7-3', 'Constitutional carry for age 21+. Concealed carry permits still issued for reciprocity', '2016-05-24', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- Missouri
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'MO'), 'concealed_carry', false, 1, false, 'Mo. Rev. Stat. § 571.107', 'Permitless carry for age 19+ or 18+ military. Training requirements waived', '2017-01-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- New Hampshire
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'NH'), 'concealed_carry', false, 1, false, 'RSA 159:6', 'Constitutional carry for residents and non-residents age 18+', '2017-02-22', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;

-- North Dakota
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES ((SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'ND'), 'concealed_carry', false, 1, false, 'N.D.C.C. § 62.1-02-05', 'Permitless carry for residents age 18+. Class 1 permits available for enhanced reciprocity', '2017-08-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET statutory_citation = EXCLUDED.statutory_citation, effective_date = EXCLUDED.effective_date, notes = EXCLUDED.notes, database_updated_at = CURRENT_TIMESTAMP;