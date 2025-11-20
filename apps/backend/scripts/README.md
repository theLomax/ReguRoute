# Data Processing Scripts

This directory contains utility scripts for processing raw data files into formats suitable for import into the ReguRoute database.

## Available Scripts

### convert-stata-to-csv.py

Converts Stata `.dta` files to CSV format.

**Requirements:**
```bash
pip install pandas pyreadstat
```

**Usage:**
```bash
python convert-stata-to-csv.py <input.dta> <output.csv>
```

**Example:**
```bash
# Convert CCWLD database
python convert-stata-to-csv.py \
  ../../data/raw/ccwld/CCWLD.dta \
  ../../data/raw/ccwld/CCWLD.csv
```

---

## Future Scripts (Planned)

- `import-rand-data.ts` - Import RAND database to PostgreSQL
- `import-tufts-data.ts` - Import Tufts/ICPSR database to PostgreSQL
- `import-ccwld-data.ts` - Import CCWLD database to PostgreSQL
- `generate-test-data.ts` - Generate test datasets for QA
- `validate-data.ts` - Validate imported data integrity

---

## Directory Structure Reference

```
ReguRoute/
├── data/
│   ├── raw/              # Downloaded data (put .dta files here)
│   ├── processed/        # Cleaned data ready for DB import
│   └── test/             # Test datasets
└── apps/backend/
    └── scripts/          # YOU ARE HERE
        ├── convert-stata-to-csv.py
        └── README.md
```

---

**Last Updated:** 2025-11-19
