import pytest
from django.core.exceptions import PermissionDenied

from domains.risk.services import create_reference_policy_version, evaluate_risk
from tests.integration.test_risk import feature_run


@pytest.mark.security
@pytest.mark.django_db
def test_risk_evaluation_cannot_cross_institution_boundary(normalisation_context) -> None:
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()

    with pytest.raises(PermissionDenied):
        evaluate_risk(feature_run=run, policy_version=policy, institution=normalisation_context[2])
