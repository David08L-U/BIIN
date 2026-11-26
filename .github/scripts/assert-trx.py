"""Fail CI if a required .NET test run contains no tests or any skips."""

import sys
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("result_file", type=Path)
    parser.add_argument("--min-tests", type=int, default=1)
    args = parser.parse_args()

    result_file = args.result_file
    if not result_file.is_file():
        print(f"Required test result file is missing: {result_file}", file=sys.stderr)
        return 1

    root = ET.parse(result_file).getroot()
    counters = root.find(".//{*}Counters")
    if counters is None:
        print(f"TRX file has no counters: {result_file}", file=sys.stderr)
        return 1

    total = int(counters.get("total", "0"))
    passed = int(counters.get("passed", "0"))
    failed = int(counters.get("failed", "0"))
    skipped = int(counters.get("notExecuted", "0"))

    print(f"{result_file}: total={total}, passed={passed}, failed={failed}, skipped={skipped}")
    if total < args.min_tests or passed < args.min_tests or failed != 0 or skipped != 0:
        print(
            f"Required test run is incomplete: expected at least {args.min_tests} passing tests and none failed or skipped.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
