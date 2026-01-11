from dataclasses import dataclass, field

from chatbot.agents.shared.state import AgentGraphDependencies, AgentState
from chatbot.api_clients.user_api import User


@dataclass
class UserSearchAgentDependencies(AgentGraphDependencies):
    pass


@dataclass
class UserSearchAgentState(AgentState):
    users: list[User] = field(default_factory=list)

    def add_users(self, new_users: list[User]) -> None:
        for new_user in new_users:
            existing_user = self._find_user(new_user.id)
            if existing_user:
                self._merge_user_attributes(existing_user, new_user)
            else:
                self.users.append(new_user)

    def _find_user(self, user_id: str) -> User | None:
        for user in self.users:
            if user.id == user_id:
                return user
        return None

    def _merge_user_attributes(self, existing_user: User, new_user: User) -> None:
        existing_attr_names = {attr.name for attr in existing_user.user_attributes}
        for new_attr in new_user.user_attributes:
            if new_attr.name not in existing_attr_names:
                existing_user.user_attributes.append(new_attr)
