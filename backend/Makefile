# Unix-friendly shortcuts (GitHub Actions / WSL / macOS). On Windows PowerShell, use the Python commands directly.
.PHONY: test validate migrate-check inventory-recheck feedback-verify https-config-check

test:
	pytest -q

migrate-check:
	python scripts/check_migration_schema.py

validate:
	python scripts/validate_system.py

inventory-recheck:
	python scripts/run_swagkey_inventory_recheck.py --mode fixture

feedback-verify:
	python scripts/verify_feedback_learning_mvp.py --dry-run-local

https-config-check:
	python scripts/check_production_https_config.py
