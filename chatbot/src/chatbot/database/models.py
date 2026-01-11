import math
from dataclasses import dataclass


@dataclass(frozen=True)
class PageInfo:
    page_number: int
    total_pages: int
    total_elements: int
    page_limit: int

    @classmethod
    def from_counts(cls, total_count: int, page: int, limit: int) -> "PageInfo":
        if total_count < 0:
            raise ValueError("total_count cannot be negative")

        return cls(page_number=page, total_pages=math.ceil(total_count / limit), total_elements=total_count, page_limit=limit)


@dataclass(frozen=True)
class OffsetPaginationRequest:
    page: int
    limit: int

    @classmethod
    def from_params(cls, page_number: int | None, limit: int | None, default_limit: int = 10) -> "OffsetPaginationRequest":
        return OffsetPaginationRequest(page=page_number if page_number is not None else 1, limit=limit if limit is not None else default_limit)


@dataclass(frozen=True)
class OffsetPaginationResponse[R]:
    items: list[R]
    page_info: PageInfo
