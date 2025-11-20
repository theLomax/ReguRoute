# ReguRoute Data Directory

This directory contains all data sources for the ReguRoute application, organized by stage and purpose.

## Directory Structure

```
data/
├── raw/          # Original, unmodified datasets from public sources
├── processed/    # Cleaned and transformed data ready for database import
├── custom/       # Manually curated data (city ordinances, custom rules)
└── test/         # Test datasets for QA and development
```

## Raw Data Sources

### `/raw/rand/` - RAND State Firearm Law Database
- **Source:** https://www.rand.org/pubs/tools/TL283.html
- **Coverage:** 1979-2024, all 50 states
- **Format:** CSV/Excel time-series
- **Files:**
  - `rand_state_firearm_laws_YYYY.csv` - Main dataset
  - `rand_codebook.pdf` - Variable definitions
  - `README.txt` - RAND documentation

### `/raw/ccwld/` - Concealed Carry Weapons License Database
- **Source:** https://www.openicpsr.org/openicpsr/project/149062/version/V1/view
- **Coverage:** 1987-2019, county-level
- **Format:** Stata (.dta) + raw state files
- **Files:**
  - `CCWLD.dta` - Main Stata dataset
  - `raw_state_data.zip` - Original state records
  - `state_memos.zip` - Documentation per state
  - `CCWLD_Codebooks.docx` - Variable definitions

### `/raw/tufts/` - Tufts/ICPSR State Firearm Law Database (optional)
- **Source:** https://www.icpsr.umich.edu/web/NACJD/studies/37363
- **Coverage:** 1991-2019, all 50 states, 134 provisions
- **Format:** CSV, SAS, SPSS, Stata, R
- **Note:** Use only if RAND doesn't cover specific provisions

## Processed Data

### `/processed/` - Import-Ready Datasets
- Cleaned and normalized versions of raw data
- Transformed to match ReguRoute database schema
- JSON or CSV format optimized for PostgreSQL import
- **Files:**
  - `regulations_state_level.json` - State regulations for import
  - `regulations_county_level.json` - County-level CCW data
  - `jurisdictions.json` - State/county geographic data

## Custom Data

### `/custom/` - Manually Curated Information
- City-level ordinances (NYC, Chicago, San Francisco, etc.)
- Transport-specific interpretations
- Conditional rules and special cases
- **Structure:**
  ```
  custom/
  ├── city_ordinances/
  │   ├── nyc.json
  │   ├── chicago.json
  │   └── san_francisco.json
  ├── transport_rules/
  │   └── vehicle_transport_requirements.json
  └── special_cases/
      └── conditional_regulations.json
  ```

## Test Data

### `/test/` - QA and Development Datasets
- Small, known-good datasets for testing
- Edge cases and boundary conditions
- Sample data for unit tests
- **Files:**
  - `test_regulations_sample.json` - 5-10 state sample
  - `test_edge_cases.json` - Complex conditional rules
  - `test_routes.json` - Sample routes for testing routing logic

## Data Processing Pipeline

```
1. Download → /raw/
2. Clean & Transform → /processed/
3. Import to Database → PostgreSQL
4. Supplement with /custom/
5. Validate with /test/
```

## .gitignore Policy

**Large raw datasets are NOT committed to git:**
- `/raw/**/*.csv`
- `/raw/**/*.dta`
- `/raw/**/*.zip`
- `/raw/**/*.xlsx`

**Small files ARE committed:**
- Documentation (README, codebooks)
- Custom curated data (`/custom/`)
- Test datasets (`/test/`)
- Processing scripts

## Data Download Instructions

### RAND Database
1. Visit https://www.rand.org/pubs/tools/TL283.html
2. Click "Download Database" or "Custom Extract"
3. Select CSV format
4. Save to `data/raw/rand/`

### CCWLD Database
1. Visit https://www.openicpsr.org/openicpsr/project/149062/version/V1/view
2. Download all files (requires free account)
3. Save to `data/raw/ccwld/`

### Tufts/ICPSR (if needed)
1. Visit https://www.icpsr.umich.edu/web/NACJD/studies/37363
2. Create free ICPSR account
3. Download CSV format
4. Save to `data/raw/tufts/`

## Processing Scripts

Data transformation scripts will be located in:
- `apps/backend/scripts/import-rand.ts`
- `apps/backend/scripts/import-ccwld.ts`
- `apps/backend/scripts/generate-test-data.ts`

---

**Last Updated:** 2025-11-19
