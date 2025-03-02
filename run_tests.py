#!/usr/bin/env python3
"""
Run all tests for the personal finance app backend.
This script will run all the tests and generate a coverage report.
"""

import os
import sys
import subprocess

if __name__ == "__main__":
    # Add the project directory to the Python path
    project_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_dir)

    # Change to the project directory
    os.chdir(project_dir)

    # Run pytest with coverage
    cmd = ["coverage", "run", "-m", "pytest", "tests/"]
    subprocess.run(cmd, check=True)

    # Generate coverage report
    subprocess.run(["coverage", "report", "-m"], check=True)

    # Generate HTML coverage report
    subprocess.run(["coverage", "html"], check=True)
    print("\nHTML coverage report generated in htmlcov/index.html")
