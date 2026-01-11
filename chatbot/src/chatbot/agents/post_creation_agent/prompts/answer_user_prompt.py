from jinja2 import Template

answer_user_prompt = Template(
    """Provide a brief, helpful response to the user about the post that was created or updated.

Requirements:
- Summarize what was accomplished (created new post / updated existing post)
- Mention key information sources if searches were used
- Note any important decisions or adaptations made
- If information was missing or incomplete, mention this briefly
- Use a friendly, professional tone without special formatting
- Keep the response concise (1-2 sentences typically)

The post content is displayed separately, so focus on the process rather than repeating the content.
"""
)
