from dataclasses import dataclass

import jwt
from starlette.requests import Request


@dataclass
class FlipBearerAuth:
    token: str
    tenant: str
    user_id: str


def get_flip_api_auth(request: Request) -> FlipBearerAuth:
    auth_from_token = _get_bearer_auth_without_validation(request)
    if auth_from_token is not None:
        return auth_from_token
    else:
        raise ValueError("Could not extract Flip API auth from request")


def _get_bearer_auth_without_validation(request: Request) -> FlipBearerAuth | None:
    token = _extract_bearer_token(request)
    if token is None:
        return None

    return _decode_token_without_validation(token)


def _extract_bearer_token(request: Request) -> str | None:
    authorization_header = request.headers.get("Authorization")
    if authorization_header is None:
        return None

    if not authorization_header.startswith("Bearer "):
        return None

    return authorization_header.removeprefix("Bearer ").strip()


def _decode_token_without_validation(token: str) -> FlipBearerAuth:
    decoded = jwt.decode(token, options={"verify_signature": False})

    tenant = decoded.get("tenant")
    if tenant is None:
        raise ValueError("JWT token did not contain 'tenant' claim")

    user_id = decoded.get("user_id")
    if user_id is None:
        raise ValueError("JWT token did not contain 'user_id' claim")

    return FlipBearerAuth(token, tenant, user_id)
