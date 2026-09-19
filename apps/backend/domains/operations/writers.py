"""Dependency-free CSV and XLSX writers.

XLSX is a small, valid SpreadsheetML package written with `zipfile`, so exports
need no extra runtime dependency. Every text cell is neutralised against
spreadsheet formula injection (a leading `=`, `+`, `-`, `@`, tab or CR would be
executed by Excel/Sheets when a recipient opens the file).
"""

from __future__ import annotations

import csv
import io
import re
import zipfile
from collections.abc import Iterable, Sequence
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from xml.sax.saxutils import escape

_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")
# Control characters are illegal in XML 1.0 and never meaningful in a data export.
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

_XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
_OOXML = "http://schemas.openxmlformats.org"
_SHEET_NS = f"{_OOXML}/spreadsheetml/2006/main"
_REL_NS = f"{_OOXML}/package/2006/relationships"
_OFFICE_REL = f"{_OOXML}/officeDocument/2006/relationships"
_MAIN_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml"

_CONTENT_TYPES = (
    f'{_XML_DECL}<Types xmlns="{_OOXML}/package/2006/content-types">'
    '<Default Extension="rels" '
    'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    f'<Override PartName="/xl/workbook.xml" ContentType="{_MAIN_CT}.sheet.main+xml"/>'
    f'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="{_MAIN_CT}.worksheet+xml"/>'
    "</Types>"
)
_ROOT_RELS = (
    f'{_XML_DECL}<Relationships xmlns="{_REL_NS}">'
    f'<Relationship Id="rId1" Type="{_OFFICE_REL}/officeDocument" Target="xl/workbook.xml"/>'
    "</Relationships>"
)
_WORKBOOK = (
    f'{_XML_DECL}<workbook xmlns="{_SHEET_NS}" xmlns:r="{_OFFICE_REL}">'
    '<sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>'
)
_WORKBOOK_RELS = (
    f'{_XML_DECL}<Relationships xmlns="{_REL_NS}">'
    f'<Relationship Id="rId1" Type="{_OFFICE_REL}/worksheet" Target="worksheets/sheet1.xml"/>'
    "</Relationships>"
)


def neutralize(value: Any) -> str:
    """Render a value as text that a spreadsheet will treat as inert."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date | Decimal | int | float):
        # Negative numbers are legitimate values, not formulas.
        return str(value)
    text = _CONTROL_CHARS.sub("", str(value))
    return f"'{text}" if text.startswith(_FORMULA_PREFIXES) else text


def write_csv(header: Sequence[str], rows: Iterable[Sequence[Any]]) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer)
    writer.writerow([neutralize(label) for label in header])
    for row in rows:
        writer.writerow([neutralize(cell) for cell in row])
    # UTF-8 BOM so Excel detects the encoding of non-ASCII names.
    return b"\xef\xbb\xbf" + buffer.getvalue().encode("utf-8")


def _column_letter(index: int) -> str:
    letters = ""
    index += 1
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def _cell(ref: str, value: Any) -> str:
    if isinstance(value, bool) or value is None or isinstance(value, datetime | date):
        text = neutralize(value)
        return f'<c r="{ref}" t="inlineStr"><is><t>{escape(text)}</t></is></c>'
    if isinstance(value, int | float | Decimal):
        return f'<c r="{ref}"><v>{value}</v></c>'
    text = neutralize(value)
    return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(text)}</t></is></c>'


def write_xlsx(header: Sequence[str], rows: Iterable[Sequence[Any]]) -> bytes:
    sheet_rows: list[str] = []
    all_rows: Iterable[Sequence[Any]] = [tuple(header), *rows]
    for row_index, row in enumerate(all_rows, start=1):
        cells = "".join(
            _cell(f"{_column_letter(col)}{row_index}", neutralize(cell) if row_index == 1 else cell)
            for col, cell in enumerate(row)
        )
        sheet_rows.append(f'<row r="{row_index}">{cells}</row>')
    sheet = (
        f'{_XML_DECL}<worksheet xmlns="{_SHEET_NS}">'
        f"<sheetData>{''.join(sheet_rows)}</sheetData></worksheet>"
    )
    parts = {
        "[Content_Types].xml": _CONTENT_TYPES,
        "_rels/.rels": _ROOT_RELS,
        "xl/workbook.xml": _WORKBOOK,
        "xl/_rels/workbook.xml.rels": _WORKBOOK_RELS,
        "xl/worksheets/sheet1.xml": sheet,
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in parts.items():
            archive.writestr(name, content)
    return buffer.getvalue()
