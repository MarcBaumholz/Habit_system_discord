import hashlib
import uuid
from datetime import UTC, datetime

import jwt


def deterministic_uuid(value: str) -> str:
    hash_value = hashlib.sha256(value.encode()).digest()
    return str(uuid.UUID(bytes=hash_value[:16], version=5))


def deterministic_timestamp() -> datetime:
    return datetime(2025, 1, 15, 10, 0, 0, tzinfo=UTC)


def create_test_jwt(tenant: str, user_id: str | None = None) -> str:
    if user_id is None:
        user_id = deterministic_uuid(f"user-{tenant}")

    payload = {
        "tenant": tenant,
        "user_id": user_id,
    }
    return jwt.encode(payload, "secret", algorithm="HS256")
