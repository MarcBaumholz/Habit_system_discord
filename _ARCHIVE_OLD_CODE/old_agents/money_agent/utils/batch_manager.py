"""
Batch Manager - Utilities for reading current batch information

Reads batch metadata from data/current-batch.json (created by TypeScript system)
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import date


def get_current_batch() -> Optional[Dict[str, Any]]:
    """
    Read current batch metadata from file.

    Returns:
        Batch metadata dict or None if no batch is active.
        Structure:
        {
            "name": "january 2026",
            "createdDate": "2026-01-01",
            "startDate": "2026-01-05",
            "endDate": "2026-03-11",
            "status": "active" | "pre-phase" | "completed"
        }
    """
    try:
        batch_file_path = Path.cwd() / "data" / "current-batch.json"

        if not batch_file_path.exists():
            return None

        with open(batch_file_path, 'r', encoding='utf-8') as f:
            batch = json.load(f)

        return batch

    except Exception as e:
        print(f"❌ Error reading batch file: {e}")
        return None


def get_current_batch_name() -> Optional[str]:
    """
    Get the name of the current batch.

    Returns:
        Batch name (e.g., "january 2026") or None if no batch is active.
    """
    batch = get_current_batch()
    return batch.get("name") if batch else None


def is_batch_active() -> bool:
    """
    Check if current batch is active (started).

    Returns:
        True if batch status is "active", False otherwise.
    """
    batch = get_current_batch()
    return batch.get("status") == "active" if batch else False


def filter_habits_by_current_batch(habits: list) -> list:
    """
    Filter habits to only include those from the current active batch.
    If no batch is active, returns all habits for backward compatibility.

    Args:
        habits: List of habit dicts (each should have optional "batch" field)

    Returns:
        Filtered list of habits matching current batch.
    """
    current_batch = get_current_batch()

    if not current_batch:
        # No active batch - return all habits for backward compatibility
        return habits

    batch_name = current_batch.get("name")

    # Filter to only include habits that match the current batch
    return [h for h in habits if h.get("batch") == batch_name]
