-- Batch insert Group 2 constitutional carry states (2019-2024)

-- 2019 Wave
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'KY'), 'concealed_carry', false, 1, false, 'Ky. Rev. Stat. § 527.020', 'Constitutional carry for age 21+. Concealed carry licenses still issued for reciprocity', '2019-06-26', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'OK'), 'concealed_carry', false, 1, false, '21 Okla. Stat. § 1290.6', 'Permitless carry for age 21+ or military/veterans 18+. Self-defense act license available', '2019-11-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'SD'), 'concealed_carry', false, 1, false, 'S.D.C.L. § 23-7-7.1', 'Constitutional carry for age 18+. Enhanced permits available for reciprocity', '2019-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;

-- 2021 Wave - Batch 1
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'AR'), 'concealed_carry', false, 1, false, 'Ark. Code § 5-73-120', 'Constitutional carry for age 18+. Background check and training not required', '2021-03-09', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'IA'), 'concealed_carry', false, 1, false, 'Iowa Code § 724.4C', 'Permitless carry for age 21+. Permit to carry weapons still available', '2021-07-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'TN'), 'concealed_carry', false, 1, false, 'Tenn. Code § 39-17-1307', 'Permitless carry for age 21+ or military 18+. Enhanced handgun carry permits available', '2021-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;

-- 2021 Wave - Batch 2
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'TX'), 'concealed_carry', false, 1, false, 'Tex. Penal Code § 46.02', 'Constitutional carry for age 21+. License to carry still available for reciprocity', '2021-09-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'MT'), 'concealed_carry', false, 1, false, 'Mont. Code § 45-8-317', 'Constitutional carry for age 18+ outside city limits. Concealed weapon permits available', '2021-02-18', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'UT'), 'concealed_carry', false, 1, false, 'Utah Code § 76-10-523', 'Constitutional carry for age 21+. Concealed firearm permits still issued', '2021-05-05', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;

-- 2022 Wave
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'OH'), 'concealed_carry', false, 1, false, 'Ohio Rev. Code § 2923.111', 'Constitutional carry for age 21+. Concealed handgun licenses still available', '2022-06-13', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'IN'), 'concealed_carry', false, 1, false, 'Ind. Code § 35-47-2-1', 'Constitutional carry for age 18+. Handgun licenses still issued for reciprocity', '2022-07-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'GA'), 'concealed_carry', false, 1, false, 'Ga. Code § 16-11-126', 'Constitutional carry for age 21+ or military 18+. Weapons carry licenses available', '2022-04-12', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;

-- 2023-2024 Wave + Vermont
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'AL'), 'concealed_carry', false, 1, false, 'Ala. Code § 13A-11-75', 'Constitutional carry for age 19+. Concealed carry permits still issued', '2023-01-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'FL'), 'concealed_carry', false, 1, false, 'Fla. Stat. § 790.01', 'Constitutional carry for age 21+. Concealed weapon licenses still available for reciprocity', '2023-07-01', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'NE'), 'concealed_carry', false, 1, false, 'Neb. Rev. Stat. § 69-2440', 'Constitutional carry for age 21+. Concealed handgun permits available', '2023-09-10', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;

-- Latest 2024 additions + Vermont
INSERT INTO regulations (jurisdiction_id, category, is_restricted, restriction_level, permit_required, statutory_citation, notes, effective_date, last_verified, database_updated_at)
VALUES 
((SELECT id FROM jurisdictions WHERE postal_code = 'LA'), 'concealed_carry', false, 1, false, 'La. Rev. Stat. § 40:1379.3', 'Constitutional carry for age 18+. Concealed handgun permits still issued', '2024-07-04', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'SC'), 'concealed_carry', false, 1, false, 'S.C. Code § 23-31-215', 'Constitutional carry for age 18+. Concealed weapon permits available for reciprocity', '2024-03-07', '2026-01-16', CURRENT_TIMESTAMP),
((SELECT id FROM jurisdictions WHERE postal_code = 'VT'), 'concealed_carry', false, 1, false, 'Vermont Constitution Ch. I, Art. 16', 'Constitutional carry since 1793. No permits required, age 16+ for concealed carry', '1793-07-01', '2026-01-16', CURRENT_TIMESTAMP)
ON CONFLICT (jurisdiction_id, category) DO UPDATE SET 
statutory_citation = EXCLUDED.statutory_citation, 
effective_date = EXCLUDED.effective_date, 
notes = EXCLUDED.notes, 
database_updated_at = CURRENT_TIMESTAMP;