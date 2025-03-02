#!/usr/bin/env python3
"""
Run all tests for the personal finance app backend.
This script will run all the tests and generate a coverage report.
"""

import os
import sys
import subprocess
import shutil


def run_tests():
    """Run all tests and generate coverage reports."""
    # Add the project directory to the Python path
    project_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_dir)

    # Change to the project directory
    os.chdir(project_dir)

    # Set up a fixed test directory in the project
    test_db_dir = os.path.join(project_dir, 'test_data')
    os.makedirs(test_db_dir, exist_ok=True)
    os.environ["TEST_DB_DIR"] = test_db_dir

    # Set up a fixed test database path
    db_path = os.path.join(test_db_dir, 'test_finance.db')

    # Remove existing test database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing test database at: {db_path}")

    os.environ["TEST_DB_PATH"] = db_path

    # Import and call create_test_database to ensure tables and test data are created
    from tests.test_initialize_db import create_test_database
    create_test_database(db_path)
    print(f"Created test database at: {db_path}")

    try:
        print("=" * 80)
        print("Running tests with coverage...")
        print("=" * 80)

        # Run pytest with coverage
        cmd = ["coverage", "run", "-m", "pytest", "tests/", "-v"]
        result = subprocess.run(cmd)

        # Generate coverage report regardless of test outcome
        print("\n" + "=" * 80)
        print("Generating coverage reports...")
        print("=" * 80)

        subprocess.run(["coverage", "report", "-m"])

        # Generate HTML coverage report
        html_dir = os.path.join(project_dir, "htmlcov")
        subprocess.run(["coverage", "html", "--directory", html_dir])
        print(f"\nHTML coverage report generated in {html_dir}")

        # Check if tests failed and exit with appropriate code
        if result.returncode != 0:
            print("\n" + "=" * 80)
            print("TESTS FAILED! See above for details.")
            print("=" * 80)
            sys.exit(result.returncode)

        print("\n" + "=" * 80)
        print("All tests passed successfully!")
        print("=" * 80)

    finally:
        # Clean up the test database
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"Removed test database at: {db_path}")

        # Clean up test directory if it's empty
        if os.path.exists(test_db_dir) and not os.listdir(test_db_dir):
            os.rmdir(test_db_dir)
            print(f"Removed empty test directory: {test_db_dir}")


if __name__ == "__main__":
    run_tests()
