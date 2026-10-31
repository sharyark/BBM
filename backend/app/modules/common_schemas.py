from datetime import datetime

from pydantic import BaseModel, Field


class VoidIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class EditableIn(BaseModel):
    """Base for document inputs: an edit (PUT) must say why; ignored on create."""

    edit_reason: str | None = Field(default=None, max_length=500)


class EditInfoOut(BaseModel):
    edit_count: int = 0
    edit_reason: str | None = None
    edited_at: datetime | None = None
