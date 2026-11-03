# services/__init__.py — expose service functions from one import point
from services.recommender import get_recommendation  # noqa: F401
from services.voice_parser import parse_voice_command  # noqa: F401
