# Data Download Guide

This guide provides step-by-step instructions for downloading all required datasets for ReguRoute.

## Prerequisites

- Free ICPSR account (for CCWLD and Tufts data)
- No account needed for RAND data

---

## 1. RAND State Firearm Law Database (PRIMARY SOURCE)

### Download Steps:

1. **Visit the RAND website:**
   ```
   https://www.rand.org/pubs/tools/TL283.html
   ```

2. **Locate the download section** (usually "Access the Database" or "Download")

3. **Choose your format:**
   - **Recommended:** CSV or Excel format
   - Alternative: Custom data extract tool

4. **Download files:**
   - Main database file
   - Codebook/documentation (PDF)
   - Any additional methodology documents

5. **Save to:**
   ```
   data/raw/rand/
   ```

### Expected Files:
- `rand_state_firearm_laws_[date].csv` or `.xlsx`
- `rand_codebook.pdf`
- `README.txt` or documentation

### File Size:
- Approximately 1-5 MB (CSV)

---

## 2. Concealed Carry Weapons License Database (CCWLD)

### Download Steps:

1. **Create free OpenICPSR account:**
   ```
   https://www.openicpsr.org/
   ```
   - Click "Sign In" → "Register"
   - Complete registration

2. **Visit the CCWLD project page:**
   ```
   https://www.openicpsr.org/openicpsr/project/149062/version/V1/view
   ```

3. **Download all files:**
   - `CCWLD.dta` (38.3 MB) - Main Stata dataset
   - `raw_state_data.zip` (273.1 MB) - Original records
   - `state_memos.zip` (42.8 MB) - State documentation
   - `CCWLD Codebooks.docx` - Variable definitions
   - `raw_to_clean.do` - Data processing script

4. **Save to:**
   ```
   data/raw/ccwld/
   ```

### Expected Total Size:
- Approximately 350-400 MB total

### Notes:
- May require accepting terms of use
- Download may take several minutes depending on connection

---

## 3. Tufts/ICPSR Database (OPTIONAL - Use if RAND insufficient)

### Download Steps:

1. **Create/login to ICPSR account:**
   ```
   https://www.icpsr.umich.edu/
   ```

2. **Visit study page:**
   ```
   https://www.icpsr.umich.edu/web/NACJD/studies/37363
   ```

3. **Click "Download"** and accept terms of use

4. **Select format:**
   - **Recommended:** Delimited (CSV)
   - Alternatives: R, Stata, SPSS, SAS

5. **Download the ZIP file**

6. **Extract to:**
   ```
   data/raw/tufts/
   ```

### Expected Files:
- CSV data file with 134 provision columns
- Codebook (PDF or text)
- Study documentation

### File Size:
- Approximately 2-10 MB (depends on format)

---

## 4. Verify Downloads

After downloading, verify your directory structure:

```
data/raw/
├── rand/
│   ├── rand_state_firearm_laws_2024.csv
│   ├── rand_codebook.pdf
│   └── README.txt
├── ccwld/
│   ├── CCWLD.dta
│   ├── CCWLD_Codebooks.docx
│   ├── raw_state_data.zip
│   └── state_memos.zip
└── tufts/  (optional)
    ├── ICPSR_37363.csv
    └── codebook.pdf
```

---

## 5. Next Steps

Once data is downloaded:

1. **Verify data integrity:**
   ```bash
   # Check file sizes match expected
   ls -lh data/raw/rand/
   ls -lh data/raw/ccwld/
   ```

2. **Read documentation:**
   - Review codebooks to understand variables
   - Note any data quirks or special coding

3. **Prepare for processing:**
   - See `docs/data-source-analysis.md` for structure details
   - Processing scripts will be in `apps/backend/scripts/`

---

## Troubleshooting

### RAND Download Issues
- **Problem:** Can't find download link
- **Solution:** Try the Law Navigator: https://www.rand.org/research/gun-policy/law-navigator.html
  - Look for "Download Database" or "Export Data" options

### CCWLD Access Issues
- **Problem:** Files won't download after login
- **Solution:**
  - Clear browser cache
  - Try different browser
  - Check email for confirmation link

### ICPSR Account Issues
- **Problem:** Can't access without institutional membership
- **Solution:**
  - ICPSR offers public-use files to non-members
  - Try accessing via Data.gov: https://catalog.data.gov/dataset/state-firearm-law-database-state-firearm-laws-1991-2019-e2e9d

---

## Alternative: Automated Download (Future)

We may create automated download scripts in the future:
```bash
# Example (not yet implemented)
pnpm run data:download --source=rand
pnpm run data:download --source=ccwld
```

For now, manual download is required.

---

**Last Updated:** 2025-11-19
**Maintainer:** ReguRoute Development Team
