import os

from config.settings.production import *  # noqa: F403

# Staging is production-shaped on purpose (same validation, same security posture);
# it differs only in the environment label and in having its own data and secrets.
APP_ENVIRONMENT = os.getenv("APP_ENVIRONMENT", "staging")
