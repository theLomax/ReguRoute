#!/usr/bin/env python3
"""
Convert Stata .dta files to CSV format for ReguRoute data processing.

Usage:
    python convert-stata-to-csv.py <input.dta> <output.csv>

Example:
    python convert-stata-to-csv.py ../../data/raw/ccwld/CCWLD.dta ../../data/raw/ccwld/CCWLD.csv

Requirements:
    pip install pandas pyreadstat
"""

import sys
import pandas as pd
from pathlib import Path


def convert_stata_to_csv(input_path: str, output_path: str) -> None:
    """Convert a Stata .dta file to CSV format."""

    print(f"Reading Stata file: {input_path}")

    try:
        # Read the .dta file
        df = pd.read_stata(input_path)

        print(f"✓ Loaded {len(df):,} rows and {len(df.columns)} columns")
        print(f"\nColumns: {', '.join(df.columns[:10])}{'...' if len(df.columns) > 10 else ''}")

        # Write to CSV
        print(f"\nWriting CSV file: {output_path}")
        df.to_csv(output_path, index=False)

        # Get file size
        output_size = Path(output_path).stat().st_size / (1024 * 1024)  # MB

        print(f"✓ Conversion complete!")
        print(f"  Output size: {output_size:.2f} MB")
        print(f"  Location: {output_path}")

    except FileNotFoundError:
        print(f"✗ Error: Input file not found: {input_path}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error during conversion: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) != 3:
        print("Usage: python convert-stata-to-csv.py <input.dta> <output.csv>")
        print("\nExample:")
        print("  python convert-stata-to-csv.py ../../data/raw/ccwld/CCWLD.dta ../../data/raw/ccwld/CCWLD.csv")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    convert_stata_to_csv(input_path, output_path)


if __name__ == "__main__":
    main()
