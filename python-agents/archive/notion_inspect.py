"""
Inspect Notion databases and print property schema + a few sample rows.
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

DB_IDS = {
    "users": os.getenv("NOTION_DATABASE_USERS", ""),
    "habits": os.getenv("NOTION_DATABASE_HABITS", ""),
    "proofs": os.getenv("NOTION_DATABASE_PROOFS", ""),
}


def normalize_notion_id(raw_id: str) -> str:
    if not raw_id:
        return raw_id
    cleaned = raw_id.replace("-", "").strip()
    if len(cleaned) != 32:
        return raw_id
    return f"{cleaned[0:8]}-{cleaned[8:12]}-{cleaned[12:16]}-{cleaned[16:20]}-{cleaned[20:32]}"


def resolve_data_source_id(notion: Client, database_id: str) -> str:
    database_id = normalize_notion_id(database_id)
    try:
        database = notion.databases.retrieve(database_id=database_id)
        data_sources = database.get("data_sources")
        if isinstance(data_sources, list) and data_sources:
            return normalize_notion_id(data_sources[0].get("id", database_id))
        if isinstance(data_sources, dict):
            return normalize_notion_id(data_sources.get("id", database_id))
        data_source = database.get("data_source")
        if isinstance(data_source, dict) and data_source.get("id"):
            return normalize_notion_id(data_source.get("id"))
    except Exception:
        return database_id
    return database_id


def query_database(notion: Client, database_id: str, page_size: int = 5) -> Dict[str, Any]:
    database_id = normalize_notion_id(database_id)
    payload = {"page_size": page_size}

    if hasattr(notion, "data_sources"):
        data_source_id = resolve_data_source_id(notion, database_id)
        try:
            return notion.data_sources.query(data_source_id=data_source_id, **payload)
        except Exception:
            pass

    if hasattr(notion.databases, "query"):
        return notion.databases.query(database_id=database_id, **payload)

    return notion.databases.parent.request(
        path=f"databases/{database_id}/query",
        method="POST",
        body=payload,
    )


def summarize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    props = row.get("properties", {})
    summary: Dict[str, Any] = {"id": row.get("id")}
    for key, value in props.items():
        value_type = value.get("type")
        if value_type == "title":
            title = value.get("title", [])
            summary[key] = title[0].get("plain_text", "") if title else ""
        elif value_type == "rich_text":
            text = value.get("rich_text", [])
            summary[key] = text[0].get("plain_text", "") if text else ""
        elif value_type == "select":
            summary[key] = (value.get("select") or {}).get("name")
        elif value_type == "multi_select":
            summary[key] = [item.get("name") for item in value.get("multi_select", [])]
        elif value_type == "number":
            summary[key] = value.get("number")
        elif value_type == "checkbox":
            summary[key] = value.get("checkbox")
        elif value_type == "date":
            summary[key] = (value.get("date") or {}).get("start")
        elif value_type == "relation":
            summary[key] = [item.get("id") for item in value.get("relation", [])]
        else:
            summary[key] = value_type
    return summary


def inspect_database(notion: Client, name: str, database_id: str) -> None:
    print("=" * 70)
    print(f"Database: {name}")
    print(f"ID: {database_id}")
    print("-" * 70)

    try:
        db_meta = notion.databases.retrieve(database_id=normalize_notion_id(database_id))
        props = db_meta.get("properties", {})
        print("Properties:")
        for prop_name, prop in props.items():
            print(f"- {prop_name}: {prop.get('type')}")
    except Exception as exc:
        print(f"Failed to retrieve schema: {exc}")
        props = {}

    try:
        result = query_database(notion, database_id, page_size=5)
        rows = result.get("results", [])
        print("\nSample rows:")
        if not rows:
            print("(no rows returned)")
        for row in rows:
            print(summarize_row(row))
    except Exception as exc:
        print(f"Failed to query rows: {exc}")


if __name__ == "__main__":
    notion = Client(auth=os.getenv("NOTION_TOKEN"))
    for name, db_id in DB_IDS.items():
        if not db_id:
            print(f"Skipping {name}: missing database id")
            continue
        inspect_database(notion, name, db_id)
