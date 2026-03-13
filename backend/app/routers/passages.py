from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional

from ..auth import get_current_user
from ..database import get_session
from ..models import (
    Passage,
    PassageCreate,
    PassageUpdate,
    PassageRead,
    Tag,
    PassageTagLink,
    User,
)
from ..services.metadata import extract_metadata

router = APIRouter(prefix="/passages", tags=["passages"])


def _get_or_create_tags(session: Session, tag_names: list[str]) -> list[Tag]:
    tags = []
    for name in tag_names:
        name = name.strip().lower()
        if not name:
            continue
        stmt = select(Tag).where(Tag.name == name)
        tag = session.exec(stmt).first()
        if not tag:
            tag = Tag(name=name)
            session.add(tag)
            session.commit()
            session.refresh(tag)
        tags.append(tag)
    return tags


def _passage_to_read(passage: Passage) -> PassageRead:
    return PassageRead(
        id=passage.id,
        selected_text=passage.selected_text,
        note=passage.note,
        source_url=passage.source_url,
        source_title=passage.source_title,
        author_name=passage.author_name,
        published_date=passage.published_date,
        summary=passage.summary,
        is_public=passage.is_public,
        saved_at=passage.saved_at,
        tags=[t.name for t in passage.tags],
    )


@router.post("", response_model=PassageRead, status_code=201)
async def create_passage(
    data: PassageCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Auto-fill metadata from URL if not provided
    meta = {}
    if not data.source_title or not data.author_name:
        meta = await extract_metadata(data.source_url)

    # Determine visibility: explicit choice > user default > public
    if data.is_public is not None:
        is_public = data.is_public
    else:
        is_public = not user.default_private

    passage = Passage(
        user_id=user.id,
        selected_text=data.selected_text,
        note=data.note,
        source_url=data.source_url,
        source_title=data.source_title or meta.get("source_title"),
        author_name=data.author_name or meta.get("author_name"),
        published_date=data.published_date,
        summary=data.summary,
        is_public=is_public,
    )

    if data.tags:
        passage.tags = _get_or_create_tags(session, data.tags)

    session.add(passage)
    session.commit()
    session.refresh(passage)
    return _passage_to_read(passage)


@router.get("", response_model=list[PassageRead])
def list_passages(
    search: Optional[str] = Query(None, description="Search text and notes"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    author: Optional[str] = Query(None, description="Filter by author"),
    visibility: Optional[str] = Query(None, description="Filter: public, private, or all"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = (
        select(Passage)
        .where(Passage.user_id == user.id)
        .order_by(Passage.saved_at.desc())  # type: ignore[union-attr]
    )

    if visibility == "public":
        stmt = stmt.where(Passage.is_public == True)
    elif visibility == "private":
        stmt = stmt.where(Passage.is_public == False)

    if search:
        stmt = stmt.where(
            Passage.selected_text.contains(search)  # type: ignore[union-attr]
            | Passage.note.contains(search)  # type: ignore[union-attr]
            | Passage.source_title.contains(search)  # type: ignore[union-attr]
        )

    if tag:
        stmt = stmt.join(PassageTagLink).join(Tag).where(Tag.name == tag.lower())

    if author:
        stmt = stmt.where(
            Passage.author_name.contains(author)  # type: ignore[union-attr]
        )

    stmt = stmt.offset(offset).limit(limit)
    passages = session.exec(stmt).all()
    return [_passage_to_read(p) for p in passages]


@router.get("/{passage_id}", response_model=PassageRead)
def get_passage(
    passage_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    passage = session.get(Passage, passage_id)
    if not passage or passage.user_id != user.id:
        raise HTTPException(status_code=404, detail="Passage not found")
    return _passage_to_read(passage)


@router.put("/{passage_id}", response_model=PassageRead)
def update_passage(
    passage_id: str,
    data: PassageUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    passage = session.get(Passage, passage_id)
    if not passage or passage.user_id != user.id:
        raise HTTPException(status_code=404, detail="Passage not found")

    update_data = data.model_dump(exclude_unset=True)
    tags_data = update_data.pop("tags", None)

    for key, value in update_data.items():
        setattr(passage, key, value)

    if tags_data is not None:
        passage.tags = _get_or_create_tags(session, tags_data)

    session.add(passage)
    session.commit()
    session.refresh(passage)
    return _passage_to_read(passage)


@router.delete("/{passage_id}", status_code=204)
def delete_passage(
    passage_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    passage = session.get(Passage, passage_id)
    if not passage or passage.user_id != user.id:
        raise HTTPException(status_code=404, detail="Passage not found")
    session.delete(passage)
    session.commit()
