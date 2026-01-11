from chatbot.api_clients.user_api import User


def format_user(user: User) -> str:
    result = f"{user.first_name} {user.last_name}"
    if user.user_attributes:
        result += "\n" + "\n".join([f"  - {attr.name}: {attr.value}" for attr in user.user_attributes])
    return result


def format_users(users: list[User]) -> str:
    return "\n".join([f"- {format_user(user)}" for user in users])
