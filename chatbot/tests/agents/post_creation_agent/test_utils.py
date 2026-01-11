from chatbot.agents.post_creation_agent.utils import sanitize_html


def test_sanitize_html_allowed_tags():
    html = '<div><a href="x">link</a><img src="s" alt="a"/><b>bold</b></div>'
    allowed = ["a", "img"]
    out = sanitize_html(html, allowed)
    assert '<a href="x">link</a>' in out
    assert '<img src="s" alt="a"/>' in out or '<img alt="a" src="s"/>' in out
    assert "<b>" not in out
    assert "bold" in out


def test_sanitize_html_strips_dangerous_tags():
    html_body = "<b>Bold</b><script>alert('xss')</script>"
    allowed = ["b"]
    out = sanitize_html(html_body, allowed)
    assert "<b>Bold</b>" in out
    assert "<script>" not in out
    assert "alert('xss')" not in out


def test_sanitize_html_no_allowed_tags():
    html = "<p>hello</p><b>world</b>"
    sanitized = sanitize_html(html, allowed_tags=[])
    assert "<p>" not in sanitized
    assert "<b>" not in sanitized
    assert "hello" in sanitized
    assert "world" in sanitized
