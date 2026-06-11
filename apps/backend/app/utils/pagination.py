from typing import TypeVar

T = TypeVar("T")


def paginate(query, page: int, per_page: int) -> dict:
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }
