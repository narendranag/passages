from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional
import uuid


class PassageTagLink(SQLModel, table=True):
    __tablename__ = "passage_tags"
    passage_id: str = Field(foreign_key="passages.id", primary_key=True)
    tag_id: str = Field(foreign_key="tags.id", primary_key=True)


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    passages: list["Passage"] = Relationship(back_populates="user")


class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(unique=True, index=True)
    passages: list["Passage"] = Relationship(
        back_populates="tags", link_model=PassageTagLink
    )


class Passage(SQLModel, table=True):
    __tablename__ = "passages"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    selected_text: str
    note: Optional[str] = None
    source_url: str
    source_title: Optional[str] = None
    author_name: Optional[str] = None
    published_date: Optional[date] = None
    summary: Optional[str] = None
    is_public: bool = Field(default=False)
    saved_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="passages")
    tags: list[Tag] = Relationship(
        back_populates="passages", link_model=PassageTagLink
    )


# --- Pydantic schemas for API request/response ---


class PassageCreate(SQLModel):
    selected_text: str
    note: Optional[str] = None
    source_url: str
    source_title: Optional[str] = None
    author_name: Optional[str] = None
    published_date: Optional[date] = None
    summary: Optional[str] = None
    is_public: bool = False
    tags: list[str] = []  # tag names


class PassageUpdate(SQLModel):
    selected_text: Optional[str] = None
    note: Optional[str] = None
    source_title: Optional[str] = None
    author_name: Optional[str] = None
    published_date: Optional[date] = None
    summary: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[list[str]] = None


class PassageRead(SQLModel):
    id: str
    selected_text: str
    note: Optional[str]
    source_url: str
    source_title: Optional[str]
    author_name: Optional[str]
    published_date: Optional[date]
    summary: Optional[str]
    is_public: bool
    saved_at: datetime
    tags: list[str] = []


class TagRead(SQLModel):
    id: str
    name: str
