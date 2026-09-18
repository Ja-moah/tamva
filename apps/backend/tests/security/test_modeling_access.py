import pytest
from django.core.exceptions import PermissionDenied

from domains.modeling.services import evaluate_model
from tests.integration.test_modeling import feature_run, model_definition, model_version


@pytest.mark.security
@pytest.mark.django_db
def test_model_evaluation_cannot_cross_institution_boundary(normalisation_context) -> None:
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    with pytest.raises(PermissionDenied):
        evaluate_model(feature_run=run, model_version=version, institution=normalisation_context[2])
