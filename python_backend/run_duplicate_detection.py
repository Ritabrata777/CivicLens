import json
import sys

from detect_duplicates_logic import detect_duplicates


def main():
    if len(sys.argv) < 4:
        print(json.dumps({"matches": [], "error": "Usage: run_duplicate_detection.py <mongo_uri> <db_name> <issue_id>"}))
        sys.exit(1)

    mongo_uri = sys.argv[1]
    db_name = sys.argv[2]
    issue_id = sys.argv[3]

    result = detect_duplicates(mongo_uri, issue_id, "/app", db_name)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
