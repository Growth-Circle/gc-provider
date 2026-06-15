"""GrowthCircle.id model provider plugin for Hermes Agent."""

from __future__ import annotations

import json
import logging
import urllib.request
from typing import Any

from providers import register_provider
from providers.base import ProviderProfile

logger = logging.getLogger(__name__)

BASE_URL = "https://ai.growthcircle.id/v1"
ENV_VAR = "GROWTHCIRCLE_API_KEY"
FREE_MODEL_SUFFIX = "-free"
DEFAULT_MODEL_ID = "gpt-5.5"
DEFAULT_MAX_TOKENS = 36_000

FALLBACK_MODELS = (
    "gpt-5.5",
    "gpt-5.5-free",
    "gpt-5.4-mini",
    "gpt-5.4-mini-free",
    "gpt-5.3-codex",
    "gpt-5.3-codex-free",
    "deepseek-v4-flash",
    "deepseek-v4-flash-free",
    "gemini-2.5-flash",
    "gemini-2.5-flash-free",
    "MiniMax-M3",
    "MiniMax-M3-free",
)


class GrowthCircleProfile(ProviderProfile):
    """OpenAI-compatible GrowthCircle.id profile with filtered live catalog."""

    def fetch_models(
        self,
        *,
        api_key: str | None = None,
        timeout: float = 8.0,
    ) -> list[str] | None:
        url = self.models_url or self.base_url.rstrip("/") + "/models"
        req = urllib.request.Request(url)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "gc-provider-hermes")
        if api_key:
            req.add_header("Authorization", f"Bearer {api_key}")

        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                payload = json.loads(resp.read().decode())
        except Exception as exc:
            logger.debug("fetch_models(growthcircle): %s", exc)
            return None

        free_models = _is_free_api_key(api_key)
        seen: set[str] = set()
        models: list[str] = []
        for item in _extract_model_items(payload):
            model_id = _normalize_model_id(item, free_models=free_models)
            if not model_id or model_id in seen:
                continue
            seen.add(model_id)
            models.append(model_id)

        return models or None

    def build_api_kwargs_extras(
        self,
        *,
        reasoning_config: dict | None = None,
        supports_reasoning: bool = False,
        **context: Any,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        if not supports_reasoning or not isinstance(reasoning_config, dict):
            return {}, {}
        if reasoning_config.get("enabled") is False:
            return {}, {}

        effort = str(reasoning_config.get("effort") or "").strip().lower()
        if effort not in {"minimal", "low", "medium", "high", "xhigh"}:
            effort = "medium"

        return {}, {"reasoning_effort": effort}


growthcircle = GrowthCircleProfile(
    name="growthcircle",
    aliases=("gc", "growthcircle-id", "growthcircleid"),
    display_name="GrowthCircle.id",
    description="GrowthCircle.id - OpenAI-compatible direct API",
    signup_url="https://growthcircle.id/app/ai",
    env_vars=(ENV_VAR,),
    base_url=BASE_URL,
    models_url=f"{BASE_URL}/models",
    auth_type="api_key",
    supports_vision=True,
    default_max_tokens=DEFAULT_MAX_TOKENS,
    fallback_models=FALLBACK_MODELS,
)

register_provider(growthcircle)


def _extract_model_items(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []

    for key in ("data", "models", "items", "results"):
        value = payload.get(key)
        if isinstance(value, list):
            return value
    return []


def _normalize_model_id(item: Any, *, free_models: bool) -> str | None:
    if isinstance(item, str):
        model_id = _read_string(item)
        return _to_free_model_id(model_id) if model_id and free_models else model_id

    if not isinstance(item, dict):
        return None
    if not _is_growthcircle_text_model(item):
        return None

    model_id = _read_string(item.get("id"))
    if not model_id:
        return None
    return _to_free_model_id(model_id) if free_models else model_id


def _is_growthcircle_text_model(item: dict[str, Any]) -> bool:
    owner = _read_string(item.get("owned_by")) or _read_string(item.get("ownedBy"))
    if owner and not _is_growthcircle_owner(owner):
        return False

    available = item.get("available_for_current_key", item.get("availableForCurrentKey"))
    if available is False:
        return False

    unit_type = _read_string(item.get("unit_type")) or _read_string(item.get("unitType"))
    if unit_type and unit_type.lower() != "token":
        return False

    output_modalities = _read_output_modalities(item)
    if output_modalities and "text" not in {modality.lower() for modality in output_modalities}:
        return False

    return True


def _read_output_modalities(item: dict[str, Any]) -> list[str] | None:
    architecture = item.get("architecture")
    if isinstance(architecture, dict):
        values = _read_string_array(
            architecture.get("output_modalities", architecture.get("outputModalities"))
        )
        if values:
            return values

    return _read_string_array(item.get("output_modalities", item.get("outputModalities")))


def _read_string_array(value: Any) -> list[str] | None:
    if not isinstance(value, list):
        return None
    values = [_read_string(item) for item in value]
    result = [item for item in values if item]
    return result or None


def _read_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None


def _is_growthcircle_owner(owner: str) -> bool:
    normalized = "".join(ch for ch in owner.lower() if ch.isalnum())
    return normalized in {"growthcircle", "growthcircleid"}


def _is_free_api_key(api_key: str | None) -> bool:
    return bool(api_key and api_key.strip().lower().startswith("gc-free-"))


def _to_free_model_id(model_id: str) -> str:
    return model_id if model_id.endswith(FREE_MODEL_SUFFIX) else f"{model_id}{FREE_MODEL_SUFFIX}"
