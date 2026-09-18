from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from domains.passport.models import PassportSectionCode
from domains.passport.services import (
    create_passport_share,
    generate_passport_snapshot,
    revoke_passport_share,
)
from tests.integration.test_passport import build_chain, grant_passport_consent


@pytest.mark.security
@pytest.mark.django_db
def test_passport_share_cannot_be_created_or_revoked_by_another_institution(
    normalisation_context,
) -> None:
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    other_institution = normalisation_context[2]
    grant_passport_consent(normalisation_context, recipient_institution=other_institution)

    with pytest.raises(PermissionDenied):
        create_passport_share(
            snapshot=snapshot,
            institution=other_institution,
            recipient_institution=other_institution,
            purpose_code="passport_sharing",
            allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
            created_by=normalisation_context[0],
            expires_at=timezone.now() + timedelta(days=7),
        )

    share, _ = create_passport_share(
        snapshot=snapshot,
        institution=normalisation_context[1],
        recipient_institution=other_institution,
        purpose_code="passport_sharing",
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
        created_by=normalisation_context[0],
        expires_at=timezone.now() + timedelta(days=7),
    )
    with pytest.raises(PermissionDenied):
        revoke_passport_share(
            share=share, institution=other_institution, revoked_by=normalisation_context[0]
        )
