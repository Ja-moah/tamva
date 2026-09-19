from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from domains.ledger.models import ExchangeRateSnapshot
from domains.ledger.services import latest_exchange_rate
from domains.partner.models import InstitutionLocaleSettings


def snapshot(**overrides):
    values = {
        "base_currency": "USD",
        "quote_currency": "GHS",
        "rate": Decimal("15.1234567890"),
        "source": "test-fixture",
        "observed_at": timezone.now(),
    }
    return ExchangeRateSnapshot.objects.create(**{**values, **overrides})


@pytest.mark.integration
@pytest.mark.django_db
class TestExchangeRateSnapshot:
    def test_preserves_precision_and_names_its_source(self):
        row = snapshot()
        row.refresh_from_db()
        assert row.rate == Decimal("15.1234567890")
        assert row.source == "test-fixture"

    @pytest.mark.parametrize(
        "overrides",
        [
            {"rate": Decimal("0")},
            {"rate": Decimal("-1")},
            {"source": "  "},
            {"quote_currency": "USD"},
            {"base_currency": "usd"},
            {"quote_currency": "GH"},
        ],
    )
    def test_invalid_rates_are_rejected(self, overrides):
        with pytest.raises(ValidationError):
            snapshot(**overrides)

    def test_observations_are_append_only(self):
        row = snapshot()
        row.rate = Decimal("1")
        with pytest.raises(ValidationError):
            row.save()

    def test_a_source_cannot_report_the_same_pair_at_the_same_instant_twice(self):
        moment = timezone.now()
        snapshot(observed_at=moment)
        with pytest.raises(ValidationError), transaction.atomic():
            snapshot(observed_at=moment)

    def test_database_rejects_non_positive_rates_even_if_validation_is_bypassed(self):
        with pytest.raises(IntegrityError), transaction.atomic():
            ExchangeRateSnapshot.objects.bulk_create(
                [
                    ExchangeRateSnapshot(
                        base_currency="USD",
                        quote_currency="GHS",
                        rate=Decimal("0"),
                        source="x",
                        observed_at=timezone.now(),
                    )
                ]
            )

    def test_no_rate_means_none_never_an_assumed_rate(self):
        assert latest_exchange_rate("USD", "GHS", max_age=timedelta(days=1)) is None

    def test_stale_rates_are_not_returned(self):
        snapshot(observed_at=timezone.now() - timedelta(days=3))
        assert latest_exchange_rate("USD", "GHS", max_age=timedelta(days=1)) is None

    def test_latest_fresh_rate_wins_and_direction_matters(self):
        snapshot(rate=Decimal("15"), observed_at=timezone.now() - timedelta(hours=3))
        newest = snapshot(rate=Decimal("16"), observed_at=timezone.now() - timedelta(hours=1))
        assert latest_exchange_rate("usd", "ghs", max_age=timedelta(days=1)) == newest
        assert latest_exchange_rate("GHS", "USD", max_age=timedelta(days=1)) is None

    def test_the_platform_ships_no_rates(self):
        assert ExchangeRateSnapshot.objects.count() == 0


@pytest.mark.integration
@pytest.mark.django_db
class TestInstitutionLocaleSettings:
    def test_defaults_are_ghana_first(self, normalisation_context):
        stored = InstitutionLocaleSettings.objects.create(institution=normalisation_context[1])
        assert (stored.country_code, stored.default_currency) == ("GH", "GHS")
        assert (stored.timezone, stored.locale) == ("Africa/Accra", "en-GH")

    def test_values_are_normalised_and_validated(self, normalisation_context):
        stored = InstitutionLocaleSettings.objects.create(
            institution=normalisation_context[1],
            country_code="ng",
            default_currency="ngn",
            timezone="Africa/Lagos",
            locale="en-NG",
        )
        assert (stored.country_code, stored.default_currency) == ("NG", "NGN")

    @pytest.mark.parametrize(
        "bad",
        [
            {"country_code": "GHA"},
            {"default_currency": "G1"},
            {"timezone": "Nowhere/Land"},
            {"locale": "not a locale"},
        ],
    )
    def test_invalid_settings_are_rejected(self, normalisation_context, bad):
        with pytest.raises(ValidationError):
            InstitutionLocaleSettings.objects.create(institution=normalisation_context[1], **bad)
