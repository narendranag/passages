from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

from ..auth import get_current_user
from ..database import get_session
from ..models import User, Passage, PassageTagLink, Tag

router = APIRouter(tags=["users"])


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    default_private: bool


class UserUpdate(BaseModel):
    name: Optional[str] = None
    default_private: Optional[bool] = None


class PublicProfile(BaseModel):
    id: str
    name: str


@router.get("/me", response_model=UserProfile)
def get_me(user: User = Depends(get_current_user)):
    return UserProfile(
        id=user.id, name=user.name, email=user.email, default_private=user.default_private
    )


@router.put("/me", response_model=UserProfile)
def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if data.name is not None:
        user.name = data.name
    if data.default_private is not None:
        user.default_private = data.default_private
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserProfile(
        id=user.id, name=user.name, email=user.email, default_private=user.default_private
    )


@router.get("/users/{user_id}/passages")
def user_public_passages(
    user_id: str,
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Passage)
        .where(Passage.user_id == user_id, Passage.is_public == True)
        .order_by(Passage.saved_at.desc())
    )

    if tag:
        stmt = stmt.join(PassageTagLink).join(Tag).where(Tag.name == tag.lower())

    from sqlmodel import func
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)
    passages = session.exec(stmt).all()

    items = [
        {
            "id": p.id,
            "selected_text": p.selected_text,
            "note": p.note,
            "source_url": p.source_url,
            "source_title": p.source_title,
            "author_name": p.author_name,
            "published_date": str(p.published_date) if p.published_date else None,
            "saved_at": p.saved_at.isoformat(),
            "tags": [t.name for t in p.tags],
        }
        for p in passages
    ]

    return {
        "user": {"id": user.id, "name": user.name},
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if total > 0 else 1,
    }
