import logging

from bs4 import BeautifulSoup

_logger = logging.getLogger(__name__)


# --- HTML Sanitization ---
def sanitize_html(html: str, allowed_tags: list[str]) -> str:
    """
    Sanitize HTML to allow only tags specified in config.
    Certain disallowed tags (like h4, h5, h6) will be replaced by allowed ones (h3).
    Other disallowed tags will be unwrapped.
    Attributes are cleaned for allowed (or replaced-and-now-allowed) tags.
    """

    allowed_attributes = {
        "a": ["href"],
        "img": ["src", "alt"],
    }

    tag_replacement_map = {
        "h4": "h3",
        "h5": "h3",
        "h6": "h3",
    }

    soup = BeautifulSoup(html, "html.parser")

    for script in soup(["script", "style"]):
        script.decompose()

    for tag in soup.find_all(True):  # Iterate over all tags
        original_tag_name = tag.name
        current_tag_name = original_tag_name

        # Step 1: Apply defined replacements
        if original_tag_name in tag_replacement_map:
            replacement_target_tag = tag_replacement_map[original_tag_name]
            if replacement_target_tag in allowed_tags:
                tag.name = replacement_target_tag
                current_tag_name = replacement_target_tag
            else:
                _logger.warning(f"Attempted to replace <{original_tag_name}> with <{replacement_target_tag}>, but <{replacement_target_tag}> is not in allowed_tags. Original tag <{original_tag_name}> will be subject to unwrap if not allowed.")
                current_tag_name = original_tag_name

        # Step 2: Process the tag (original or successfully replaced)
        if current_tag_name in allowed_tags:
            allowed_attrs_for_tag = allowed_attributes.get(current_tag_name, [])
            for attr in list(tag.attrs):  # Use list(tag.attrs) for safe iteration while modifying
                if attr not in allowed_attrs_for_tag:
                    del tag.attrs[attr]
        else:
            tag.unwrap()

    return str(soup)
