# Constitutional Carry States - Batch Data Request

## Objective
Provide official legal information for constitutional carry (permitless concealed carry) laws for the following states. For each state, provide the specific statutory citation, effective date, and age requirements.

## States to Process
Based on 2024 data, these states have constitutional carry laws:

**Group 1: Early Adopters (2003-2017)**
- Alaska (AK) - 2003
- Arizona (AZ) - 2010  
- Wyoming (WY) - 2011
- Kansas (KS) - 2015
- Maine (ME) - 2015
- Idaho (ID) - 2016
- Mississippi (MS) - 2016
- West Virginia (WV) - 2016
- Missouri (MO) - 2017
- New Hampshire (NH) - 2017
- North Dakota (ND) - 2017

**Group 2: Recent Wave (2019-2024)**
- Kentucky (KY) - 2019
- Oklahoma (OK) - 2019
- South Dakota (SD) - 2019
- Arkansas (AR) - 2021
- Iowa (IA) - 2021
- Tennessee (TN) - 2021
- Texas (TX) - 2021
- Montana (MT) - 2021
- Utah (UT) - 2021
- Ohio (OH) - 2022
- Indiana (IN) - 2022
- Georgia (GA) - 2022
- Alabama (AL) - 2023
- Florida (FL) - 2023
- Nebraska (NE) - 2023
- Louisiana (LA) - 2024
- South Carolina (SC) - 2024

**Special Case:**
- Vermont (VT) - Constitutional carry since 1793 (no modern statute needed)

## Required Information Format
For each state, provide:

```json
{
  "state": "State Name",
  "postal_code": "XX", 
  "effective_date": "YYYY-MM-DD",
  "statutory_citation": "Official state code citation",
  "minimum_age": 18 or 21,
  "notes": "Any special conditions or exemptions",
  "official_source": "Link to state statute or official source"
}
```

## Instructions
Please provide this data in batches of 8-10 states to ensure accuracy and manageability. Focus on official state statutes and government sources only. Include the exact legal citation (e.g., "Alabama Code § 13A-11-73") and verify against official state legislative websites.

Start with Group 1 states (Alaska through North Dakota).