from pathlib import Path

_PROJECT_ROOT_MARKER = "pyproject.toml"


def get_project_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current] + list(current.parents):
        if (parent / _PROJECT_ROOT_MARKER).exists():
            return parent

    raise FileNotFoundError(f"Project root with marker '{_PROJECT_ROOT_MARKER}' not found.")
