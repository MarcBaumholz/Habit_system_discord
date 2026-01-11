from typing import Literal
from uuid import UUID

from chatbot.api_clients.permissions import PermissionsCoreApi
from chatbot.util.auth import FlipBearerAuth


class MissingPermissionException(Exception):
    def __init__(self, user_id: str, tenant: str, permission: str):
        self.message = f"User {user_id} does not have permission {permission} in tenant {tenant}"
        self.user_id = user_id
        self.tenant = tenant
        self.permission = permission

        super().__init__(self.message)


class MissingUserGroupPermissionException(Exception):
    def __init__(self, user_id: str, tenant: str, permission: str, user_group_id: UUID):
        self.message = f"User {user_id} does not have permission {permission} for usergroup {user_group_id} in tenant {tenant}"
        self.user_id = user_id
        self.tenant = tenant
        self.permission = permission
        self.user_group_id = user_group_id

        super().__init__(self.message)


type FlipPermission = Literal["ASK_AI:MANAGE"]
type FlipUserGroupPermission = Literal["USER_GROUP:MANAGE_RULES"]


class PermissionService:
    def __init__(self, permissions_api: PermissionsCoreApi):
        self.permissions_api = permissions_api

    async def has_permission(self, auth: FlipBearerAuth, permission: FlipPermission) -> bool:
        result = await self.permissions_api.check_permission(auth.tenant, auth.user_id, permission)

        return result.has_permission

    async def check_permission(self, auth: FlipBearerAuth, permission: FlipPermission) -> None:
        if not await self.has_permission(auth, permission):
            raise MissingPermissionException(auth.user_id, auth.tenant, permission)

    async def has_user_group_permission(self, auth: FlipBearerAuth, user_group_id: UUID, permission: FlipUserGroupPermission) -> bool:
        result = await self.permissions_api.check_usergroup_permission(auth.tenant, str(user_group_id), auth.user_id, permission)

        return result.has_permission

    async def check_user_group_permission(self, auth: FlipBearerAuth, user_group_id: UUID, permission: FlipUserGroupPermission) -> None:
        if not await self.has_user_group_permission(auth, user_group_id, permission):
            raise MissingUserGroupPermissionException(auth.user_id, auth.tenant, permission, user_group_id)
