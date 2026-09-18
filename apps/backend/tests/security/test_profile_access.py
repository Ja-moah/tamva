import pytest
from django.core.exceptions import PermissionDenied

from domains.profile.services import compute_profile
from tests.integration.test_profile import PERIOD_END, PERIOD_START


@pytest.mark.security
@pytest.mark.django_db
def test_profile_cannot_cross_institution_boundary(normalisation_context):
    with pytest.raises(PermissionDenied):
        compute_profile(
            customer_id=normalisation_context[0].id,
            institution=normalisation_context[2],
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )
