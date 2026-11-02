"""One generic shape for every report: the UI, the Excel export and the PDF all render from it."""

import datetime as dt
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Literal

from app.core.money import money, qty

ColType = Literal["text", "date", "money", "qty", "int", "drcr", "percent"]

# Words shown next to a signed (debit-positive) balance instead of Dr/Cr: (when positive, when negative).
# Which word fits depends on whose khata it is, e.g. a positive customer balance is money still to collect.
Sides = tuple[str, str]
CUSTOMER_SIDES: Sides = ("Baqaya", "Advance")
SUPPLIER_SIDES: Sides = ("Advance", "Baqaya")
STAFF_SIDES: Sides = ("Advance", "Baqaya")
DEFAULT_SIDES: Sides = ("Lena", "Dena")


@dataclass(frozen=True)
class Col:
    key: str
    label: str
    type: ColType = "text"
    sides: Sides | None = None  # drcr columns only


@dataclass
class ReportTable:
    title: str
    columns: list[Col]
    rows: list[dict[str, Any]]
    totals: dict[str, Any] | None = None
    subtitle: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        types = {c.key: c.type for c in self.columns}
        return {
            "title": self.title,
            "subtitle": self.subtitle,
            "columns": [
                {"key": c.key, "label": c.label, "type": c.type, **({"sides": list(c.sides)} if c.sides else {})}
                for c in self.columns
            ],
            "rows": [{k: _json(v, types.get(k)) for k, v in row.items()} for row in self.rows],
            "totals": {k: _json(v, types.get(k)) for k, v in self.totals.items()} if self.totals else None,
            "meta": {k: _json(v, None) for k, v in self.meta.items()},
        }


def _json(value: Any, col_type: str | None) -> Any:
    if isinstance(value, Decimal):
        if col_type == "qty":
            return str(qty(value))
        if col_type in ("int", "percent"):
            return str(value.normalize()) if col_type == "percent" else int(value)
        return str(money(value))
    if isinstance(value, dt.date):
        return value.isoformat()
    return value


def fmt_money(value: Any) -> str:
    return f"{money(Decimal(str(value or 0))):,.2f}"


def fmt_qty(value: Any) -> str:
    return f"{qty(Decimal(str(value or 0))):,.3f}".rstrip("0").rstrip(".")


def fmt_date(value: Any) -> str:
    if isinstance(value, dt.date):
        return value.strftime("%d-%m-%Y")
    if isinstance(value, str) and len(value) == 10 and value[4] == "-":
        return dt.date.fromisoformat(value).strftime("%d-%m-%Y")
    return value or ""


def fmt_balance(value: Any, sides: Sides | None = None) -> str:
    """Signed balance as "1,200.00 Baqaya" / "300.00 Advance"."""
    pos, neg = sides or DEFAULT_SIDES
    amount = Decimal(str(value or 0))
    return f"{fmt_money(abs(amount))} {pos if amount > 0 else neg if amount < 0 else ''}".strip()


def fmt_cell(value: Any, col_type: str, sides: Sides | None = None) -> str:
    if value is None or value == "":
        return ""
    if col_type == "money":
        return fmt_money(value)
    if col_type == "qty":
        return fmt_qty(value)
    if col_type == "date":
        return fmt_date(value)
    if col_type == "int":
        return f"{int(Decimal(str(value))):,}"
    if col_type == "percent":
        return f"{Decimal(str(value)):.1f}%"
    if col_type == "drcr":
        return fmt_balance(value, sides)
    return str(value)
