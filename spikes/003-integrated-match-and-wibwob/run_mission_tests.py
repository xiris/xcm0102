from __future__ import annotations

import subprocess
import sys

TEST_FILE = "spikes/003-integrated-match-and-wibwob/tests/test_integrated_engine.py"


def collect_tests() -> list[str]:
    completed = subprocess.run(
        [sys.executable, "-m", "pytest", "--collect-only", "-q", TEST_FILE],
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in completed.stdout.splitlines() if line.startswith("spikes/")]


def main() -> int:
    tests = collect_tests()
    if not tests:
        print("MISSION ABORTED: no tests collected", file=sys.stderr)
        return 1

    for index, test in enumerate(tests, start=1):
        print(f"\nMISSION {index:02d}: {test}", flush=True)
        completed = subprocess.run([sys.executable, "-m", "pytest", test, "-q"])
        if completed.returncode != 0:
            print(f"MISSION {index:02d} FAILED", flush=True)
            return completed.returncode
        print(f"MISSION {index:02d} PASSED", flush=True)

    print(f"\nALL {len(tests)} MISSIONS PASSED", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
