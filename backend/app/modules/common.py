"""Helpers shared by the document services (challan, payment, expense, ...)."""

import datetime as dt
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Conflict, DomainError, NotFound
from app.modules.common_models import ACTIVE, VOID


def get_or_404[T](db: Session, model: type[T], id_: int, label: str | None = None) -> T:
    obj = db.get(model, id_)
    if obj is None:
        raise NotFound(f"{label or model.__name__} {id_} not found")
    return obj


def find_by_client_ref[T](db: Session, model: type[T], client_ref: uuid.UUID | None) -> T | None:
    if client_ref is None:
        return None
    return db.scalar(select(model).where(model.client_ref == client_ref))  # type: ignore[attr-defined]


def ensure_active(doc) -> None:
    if doc.status != ACTIVE:
        raise Conflict("This document is void and cannot be changed", code="DOCUMENT_VOID")


def mark_void(doc, reason: str, user_id: int | None) -> None:
    ensure_active(doc)
    doc.status = VOID
    doc.void_reason = reason
    doc.voided_at = dt.datetime.now(dt.UTC)
    doc.voided_by = user_id


def mark_edited(db: Session, doc, reason: str | None) -> None:
    """Record why a document was changed. Called by every service `update`, so an edit without a reason fails."""
    reason = (reason or "").strip()
    if len(reason) < 3:
        raise DomainError("Please write why this entry is being changed", code="EDIT_REASON_REQUIRED")
    actor = db.info.get("actor")
    doc.edit_count = (doc.edit_count or 0) + 1
    doc.edit_reason = reason
    doc.edited_at = dt.datetime.now(dt.UTC)
    doc.edited_by = getattr(actor, "user_id", None)
