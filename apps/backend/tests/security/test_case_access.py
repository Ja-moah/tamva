import pytest
from django.core.exceptions import PermissionDenied

from domains.case.models import Case
from domains.case.services import add_case_note, assign_case, transition_case_status
from tests.integration.test_case import block_risk_event, open_case_from_event_helper


@pytest.mark.security
@pytest.mark.django_db
def test_case_cannot_be_read_or_mutated_by_another_institution(normalisation_context) -> None:
    risk_event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(risk_event, normalisation_context[1])
    other_institution = normalisation_context[2]

    with pytest.raises(PermissionDenied):
        transition_case_status(
            case=case, new_status=Case.Status.TRIAGED, institution=other_institution
        )
    with pytest.raises(PermissionDenied):
        assign_case(
            case=case,
            assignee=None,
            assigned_by=normalisation_context[0],
            institution=other_institution,
        )
    with pytest.raises(PermissionDenied):
        add_case_note(
            case=case, author=normalisation_context[0], body="guess", institution=other_institution
        )
