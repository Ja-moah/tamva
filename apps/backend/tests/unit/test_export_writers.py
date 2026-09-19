import io
import zipfile
from datetime import UTC, datetime
from decimal import Decimal
from xml.etree import ElementTree

import pytest

from domains.operations.writers import neutralize, write_csv, write_xlsx


@pytest.mark.unit
@pytest.mark.parametrize("payload", ["=SUM(A1)", "+1+1", "-2+3", "@cmd", "\t=1", "\r=1"])
def test_formula_like_text_is_neutralised(payload: str) -> None:
    assert neutralize(payload).startswith("'")


@pytest.mark.unit
def test_numbers_and_dates_are_not_mangled() -> None:
    assert neutralize(Decimal("-12.50")) == "-12.50"
    assert neutralize(-3) == "-3"
    assert neutralize(None) == ""
    assert neutralize(True) == "true"
    assert neutralize(datetime(2026, 9, 1, 12, 0, tzinfo=UTC)).startswith("2026-09-01T12:00")


@pytest.mark.unit
def test_control_characters_are_stripped() -> None:
    assert neutralize("a\x00b\x07c") == "abc"


@pytest.mark.unit
def test_csv_has_bom_header_and_neutralised_cells() -> None:
    data = write_csv(["Name", "Note"], [["Ama", "=HYPERLINK(1)"], ["Kofi", "ok"]])
    assert data.startswith(b"\xef\xbb\xbf")
    lines = data.decode("utf-8-sig").splitlines()
    assert lines[0] == "Name,Note"
    assert lines[1] == "Ama,'=HYPERLINK(1)"


@pytest.mark.unit
def test_xlsx_is_a_valid_package_with_escaped_neutralised_text() -> None:
    data = write_xlsx(["Name", "Score"], [["A & <B>", 5], ["=cmd", Decimal("1.5")]])
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        assert archive.testzip() is None
        names = set(archive.namelist())
        assert {"[Content_Types].xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"} <= names
        sheet = archive.read("xl/worksheets/sheet1.xml")
    root = ElementTree.fromstring(sheet)  # raises if escaping is wrong
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    text = [t.text for t in root.iterfind(".//m:t", ns)]
    assert "A & <B>" in text
    assert "'=cmd" in text
