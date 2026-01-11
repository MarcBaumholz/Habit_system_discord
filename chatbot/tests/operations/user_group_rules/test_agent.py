from chatbot.operations.user_group_rules import prompts
from chatbot.operations.user_group_rules.agent import (
    AttributeDefinitionInput,
    RoleInput,
)


class TestPromptRendering:
    def test_system_prompt_renders_attribute_definitions(self):
        # Given
        attribute_definitions = [
            AttributeDefinitionInput(technical_name="department", title="Department"),
            AttributeDefinitionInput(technical_name="location", title="Office Location"),
        ]
        roles = [
            RoleInput(id="role-123", title="Manager"),
        ]

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "department" in rendered
        assert "Department" in rendered
        assert "location" in rendered
        assert "Office Location" in rendered

    def test_system_prompt_renders_attribute_without_title(self):
        # Given
        attribute_definitions = [
            AttributeDefinitionInput(technical_name="custom_field", title=None),
        ]
        roles = []

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "custom_field" in rendered
        assert "(None)" not in rendered

    def test_system_prompt_renders_roles(self):
        # Given
        attribute_definitions = []
        roles = [
            RoleInput(id="role-abc-123", title="Administrator"),
            RoleInput(id="role-def-456", title="Member"),
        ]

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "role-abc-123" in rendered
        assert "Administrator" in rendered
        assert "role-def-456" in rendered
        assert "Member" in rendered

    def test_system_prompt_renders_role_without_title(self):
        # Given
        attribute_definitions = []
        roles = [
            RoleInput(id="role-no-title", title=None),
        ]

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "role-no-title" in rendered

    def test_system_prompt_renders_empty_attributes_message(self):
        # Given
        attribute_definitions = []
        roles = [RoleInput(id="role-1", title="Role")]

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "No attribute definitions are currently available" in rendered

    def test_system_prompt_renders_empty_roles_message(self):
        # Given
        attribute_definitions = [AttributeDefinitionInput(technical_name="dept", title="Department")]
        roles = []

        # When
        rendered = prompts.user_group_rules_agent_system_prompt.render(
            attribute_definitions=attribute_definitions,
            roles=roles,
        )

        # Then
        assert "No roles are currently available" in rendered
