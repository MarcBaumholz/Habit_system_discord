import re
from pathlib import Path

from fastapi_code_generator.parser import OpenAPIParser
from fastapi_code_generator.visitor import Visitor


def custom_visitor(parser: OpenAPIParser, model_path: Path) -> dict[str, object]:
    call_expressions: dict[str, str] = {}

    for operation in parser.operations.values():
        result = re.findall(r"(\w+):", operation.snake_case_arguments)
        call_expressions[operation.function_name] = ", ".join(result)

    return {
        "call_expressions": call_expressions,
    }


visit: Visitor = custom_visitor
