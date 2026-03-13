from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional

from ..database import get_session
from ..models import Passage, PassageTagLink, Tag, User

router = APIRouter(prefix="/feed", tags=["feed"])


class FeedItem(dict):
    """Feed items include the saver's display name."""
    pass


def _passage_to_feed_item(passage: Passage) -> dict:
    return {
        "id": passage.id,
        "selected_text": passage.selected_text,
        "note": passage.note,
        "source_url": passage.source_url,
        "source_title": passage.source_title,
        "author_name": passage.author_name,
        "published_date": str(passage.published_date) if passage.published_date else None,
        "saved_at": passage.saved_at.isoformat(),
        "tags": [t.name for t in passage.tags],
        "saved_by": passage.user.name if passage.user else None,
        "user_id": passage.user_id,
    }


@router.get("")
def public_feed(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = (
        select(Passage)
        .where(Passage.is_public == True)
        .order_by(Passage.saved_at.desc())
    )

    if search:
        stmt = stmt.where(
            Passage.selected_text.contains(search)
            | Passage.source_title.contains(search)
            | Passage.author_name.contains(search)
        )

    if tag:
        stmt = stmt.join(PassageTagLink).join(Tag).where(Tag.name == tag.lower())

    # Count total for pagination
    from sqlmodel import func
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)
    passages = session.exec(stmt).all()

    return {
        "items": [_passage_to_feed_item(p) for p in passages],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if total > 0 else 1,
    }
