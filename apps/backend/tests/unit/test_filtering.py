import pytest
from rest_framework.exceptions import ValidationError

from packages.common.filtering import FilterSpec, SearchSpec, validate_params

SPECS = (
    FilterSpec("decision", "decision", "choice", choices=("ALLOW", "BLOCK")),
    FilterSpec("score_min", "score", "decimal", "gte"),
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("date_to", "evaluated_at", "datetime", "lte"),
    FilterSpec("unread", "read_at", "bool", "isnull"),
)
ORDERING = {"score": "score", "evaluated_at": "evaluated_at"}


def check(params: dict[str, str], search: SearchSpec | None = None) -> None:
    validate_params(params, specs=SPECS, search=search, ordering_fields=ORDERING)


@pytest.mark.unit
def test_valid_parameters_pass() -> None:
    check(
        {
            "decision": "BLOCK",
            "score_min": "500.5",
            "customer": "11111111-1111-1111-1111-111111111111",
            "date_to": "2026-09-01",
            "unread": "true",
            "ordering": "-score,evaluated_at",
            "page": "2",
            "page_size": "50",
        }
    )


@pytest.mark.unit
def test_unknown_parameter_is_rejected_not_ignored() -> None:
    with pytest.raises(ValidationError) as excinfo:
        check({"decison": "BLOCK"})  # typo must not silently return everything
    assert "decison" in excinfo.value.detail


@pytest.mark.unit
@pytest.mark.parametrize(
    ("param", "value"),
    [
        ("decision", "MAYBE"),
        ("score_min", "high"),
        ("customer", "not-a-uuid"),
        ("date_to", "yesterday"),
        ("unread", "sometimes"),
    ],
)
def test_malformed_values_are_rejected_with_the_offending_param(param: str, value: str) -> None:
    with pytest.raises(ValidationError) as excinfo:
        check({param: value})
    assert param in excinfo.value.detail


@pytest.mark.unit
def test_ordering_is_an_allow_list() -> None:
    with pytest.raises(ValidationError) as excinfo:
        check({"ordering": "customer_id"})
    assert "ordering" in excinfo.value.detail
    # An ORM traversal must never be sortable through the public parameter.
    with pytest.raises(ValidationError):
        check({"ordering": "customer__password"})


@pytest.mark.unit
def test_search_parameter_is_only_accepted_when_declared() -> None:
    with pytest.raises(ValidationError):
        check({"search": "abc"})
    check({"search": "abc"}, search=SearchSpec(("reference",)))
