# Firearm Regulation Data Source Analysis

This document analyzes public firearm regulation databases to inform our schema design for ReguRoute.

## Data Sources Identified

### 1. State Firearm Law Database (Tufts University / ICPSR)
**Source:** https://www.icpsr.umich.edu/web/NACJD/studies/37363

#### Coverage
- **Time Period:** 1991-2019 (29 years)
- **Geographic:** All 50 US states
- **Provisions Tracked:** 134 firearm law provisions

#### Data Structure
- **Format:** State-year observations (panel data)
- **Coding:** Binary (1 = law present, 0 = law absent)
  - **Exception:** Gun rights laws (stand your ground, immunity, preemption) are reverse-coded
- **Organization:** 14 major categories

#### Categories Covered (14 total)
1. Firearm transfer regulations
2. Ammunition regulations
3. Possession rules
4. Storage requirements
5. Trafficking provisions
6. Manufacturer liability
7. (Additional 8 categories not specified in search results)

#### Download Formats Available
- CSV (Delimited)
- SAS
- SPSS
- Stata
- ASCII
- R
- All packaged as ZIP files

#### Data Sources Used
- Thomson Reuters Westlaw
- Everytown for Gun Safety
- ATF publications
- Law Center to Prevent Gun Violence

#### Documentation
- Comprehensive codebook explaining coding criteria
- Transparency documentation for exemptions and nuances
- Classification methodology

---

### 2. RAND State Firearm Law Database
**Source:** https://www.rand.org/pubs/tools/TL283.html

#### Coverage
- **Time Period:** 1979-2024 (45 years) - Updated regularly
- **Geographic:** All 50 US states
- **Law Classes:** 20 major classes (condensed from 72+ provisions)

#### Data Structure
- **Format:** Longitudinal/time-series
- **Coding:** Dichotomous variables (1 = present/yes)
- **Organization:** 20 major law classes with subclasses

#### Major Law Classes (20 total, partial list identified)
1. Background checks
2. Dealer licensing/regulations
3. Child-access prevention
4. Concealed-carry laws
5. Self-defense laws (stand your ground, etc.)
6. Assault weapon bans
7. Large capacity magazine bans
8. Waiting periods
9. Extreme risk protection orders (red flag laws)
10. Firearm removal
11. Mental health prohibitions
12. Domestic violence prohibitions
13. Trafficking laws
14. Gun-free zones
15. Permit requirements
16. Registration requirements
17. Safe storage laws
18. (Additional classes not specified in search results)

#### Features
- **Interactive Navigator:** Web-based visualization tool
- **Custom Extracts:** Users can build custom datasets
- **Time-series formatted:** Optimized for longitudinal analysis
- **Regular Updates:** Includes changelog tracking all changes
- **Free Public Access:** Full database downloadable

#### Documentation
- Comprehensive codebook for all 72 firearm law provisions
- Methods documentation
- Policy analysis reviews for 18 law classes

---

### 3. NIJ/DOJ State Firearm Law Database
**Source:** https://catalog.data.gov/dataset/state-firearm-law-database-state-firearm-laws-1991-2019-e2e9d
**Also:** https://www.icpsr.umich.edu/web/NACJD/studies/37363

#### Important Note
This appears to be **the same dataset** as the Tufts/ICPSR database (Study #37363). The NIJ/DOJ funded the research, but the data is distributed through ICPSR.

#### Coverage
- **Time Period:** 1991-2019
- **Geographic:** All 50 US states
- **Provisions:** 134 firearm safety laws in 14 categories

#### Distribution
- Available on Data.gov (public domain, "us-pd" license)
- Distributed through ICPSR
- No usage restrictions

---

### 4. Concealed Carry Weapons License Database (CCWLD)
**Source:** https://www.openicpsr.org/openicpsr/project/149062/version/V1/view

#### Coverage
- **Time Period:** 1987-2019 (33 years)
- **Geographic:** County and state-level data
- **Focus:** CCW license applications, issuances, and denials

#### Data Structure
- **Granularity:** County-level (more granular than other databases!)
- **Variables:** Applications, issuances, denials by county/state/year
- **Format:** Longitudinal panel data

#### Download Formats Available
- **CCWLD.dta** (38.3 MB) - Stata format dataset
- **raw_state_data.zip** (273.1 MB) - Original state records
- **state_memos.zip** (42.8 MB) - Documentation per state
- **CCWLD Codebooks.docx** - Variable definitions
- **raw_to_clean.do** - Stata data processing syntax

#### Data Collection
- Freedom of information requests to state governments (2019-2020)
- Internet searches for publicly available data
- Data cleaning completed in 2021

#### Principal Investigator
Trent Steidley (University of Denver)

#### Unique Value
- **County-level data** - Only database with sub-state geographic granularity
- **Permit statistics** - Applications vs. issuances vs. denials
- Useful for understanding "shall-issue" vs. "may-issue" state differences

---

## Key Differences Between Databases

| Feature | Tufts/ICPSR (NIJ/DOJ) | RAND | CCWLD |
|---------|-------------|------|-------|
| Time Coverage | 1991-2019 | 1979-2024 (ongoing) | 1987-2019 |
| Granularity | 134 provisions | 20 classes (72 provisions) | CCW permits only |
| Categories | 14 | 20 | 1 (concealed carry) |
| Geographic Level | State | State | **County & State** |
| Updates | Static (2019 endpoint) | Regularly updated | Static (2019 endpoint) |
| Formats | CSV, SAS, SPSS, Stata, R, ASCII | Custom extracts, time-series | Stata, raw data |
| Interface | Download only | Interactive navigator + download | Download only |
| Focus | Law provisions | Law provisions | **Permit statistics** |

---

## Implications for ReguRoute Schema

### Strengths to Adopt
1. **Binary coding system** - Simple, clear presence/absence of laws
2. **State-year observations** - Track law changes over time
3. **Categorical organization** - Group related regulations
4. **Reverse coding** - Handle protective/permissive laws differently

### Gaps for Our Use Case
1. **Geographic granularity** - RAND/Tufts are state-level only
   - **CCWLD provides county-level** (helpful!)
   - Still need: City-level regulations (NYC, Chicago, etc.)
2. **Transport-specific rules** - Not all 134/72 provisions are relevant to transportation
   - We need: Focus on carry, transport, magazine capacity, firearm types
3. **Polygon data** - No geospatial boundaries included
   - We need: Geographic boundaries for avoidance routing
4. **Real-time updates** - All databases are static or periodic
   - We need: Crowdsourced mechanism for rapid updates
5. **Conditional logic** - Binary coding doesn't capture complex rules
   - We need: Rules like "legal IF magazine ≤ 10 rounds AND unloaded"

### Recommended Multi-Source Approach

**Note:** CCWLD data is **NOT being used** - it contains permit statistics (applications/denials), not transport laws.

1. **Primary data: RAND State Firearm Law Database**
   - Most current (1979-2024, regularly updated)
   - 20 law classes covering key transport-relevant categories
   - Filter to ~8-10 transport-relevant classes
   - **This is our main source**

2. **Supplement with Tufts/ICPSR for granular provisions**
   - Use if RAND doesn't cover specific transport requirements
   - Provides more granular 134 provision breakdown
   - Good for historical context (1991-2019)

3. **Extend with custom fields**:
   - City-level jurisdictions (manual curation for major cities)
   - Conditional rules (JSON or structured format)
   - Severity/risk scoring for routing
   - Geographic polygons (PostGIS geometries from Census TIGER/Line)

4. **Add crowdsourcing layer** for:
   - City-level ordinances (NYC, Chicago, San Francisco, etc.)
   - Recent changes not yet in databases
   - User-reported enforcement patterns
   - Local interpretation nuances
   - Transport-specific interpretations

---

## Next Steps

1. **Download RAND database** - Get the full dataset in CSV format
2. **Analyze actual data structure** - Examine the CSV schema and field names
3. **Map relevant categories** - Identify which of the 20 classes apply to transport
4. **Design import pipeline** - Create migration to load RAND data
5. **Design extension schema** - Add our custom fields for routing needs
6. **Create jurisdictions table** - Start with states, plan for county/city expansion
