#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="growthcircle"
PLUGIN_RELATIVE_DIR="hermes/plugins/model-providers/${PLUGIN_NAME}"
GC_PROVIDER_REF="${GC_PROVIDER_REF:-main}"
RAW_BASE="${GC_PROVIDER_RAW_BASE:-https://raw.githubusercontent.com/Growth-Circle/gc-provider/${GC_PROVIDER_REF}/${PLUGIN_RELATIVE_DIR}}"

HERMES_HOME="${HERMES_HOME:-${HOME}/.hermes}"
TARGET_ROOT="${HERMES_HOME}/plugins/model-providers"
TARGET_DIR="${TARGET_ROOT}/${PLUGIN_NAME}"

SCRIPT_PATH="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_PATH}" != /* ]]; then
  SCRIPT_PATH="${PWD}/${SCRIPT_PATH}"
fi
while [[ -L "${SCRIPT_PATH}" ]]; do
  LINK_TARGET="$(readlink "${SCRIPT_PATH}")"
  if [[ "${LINK_TARGET}" == /* ]]; then
    SCRIPT_PATH="${LINK_TARGET}"
  else
    SCRIPT_PATH="$(cd -- "$(dirname -- "${SCRIPT_PATH}")" && pwd)/${LINK_TARGET}"
  fi
done
SCRIPT_DIR="$(cd -- "$(dirname -- "${SCRIPT_PATH}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
LOCAL_PLUGIN_DIR="${REPO_ROOT}/${PLUGIN_RELATIVE_DIR}"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gc-provider-hermes.XXXXXX")"
BACKUP_DIR=""

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

restore_on_error() {
  if [[ -n "${BACKUP_DIR}" && -e "${BACKUP_DIR}" && ! -e "${TARGET_DIR}" ]]; then
    mv "${BACKUP_DIR}" "${TARGET_DIR}"
  fi
}
trap restore_on_error ERR

stage_from_local() {
  mkdir -p "${TMP_DIR}/${PLUGIN_NAME}"
  cp -R "${LOCAL_PLUGIN_DIR}/." "${TMP_DIR}/${PLUGIN_NAME}/"
  find "${TMP_DIR}/${PLUGIN_NAME}" -type d -name "__pycache__" -prune -exec rm -rf {} +
  find "${TMP_DIR}/${PLUGIN_NAME}" -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete
}

stage_from_remote() {
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required when the installer is not run from a gc-provider checkout." >&2
    exit 1
  fi

  mkdir -p "${TMP_DIR}/${PLUGIN_NAME}"
  for file in "__init__.py" "plugin.yaml" "README.md"; do
    curl -fsSL "${RAW_BASE}/${file}" -o "${TMP_DIR}/${PLUGIN_NAME}/${file}"
  done
}

if [[ -d "${LOCAL_PLUGIN_DIR}" ]]; then
  stage_from_local
  SOURCE_LABEL="local checkout"
else
  stage_from_remote
  SOURCE_LABEL="${RAW_BASE}"
fi

mkdir -p "${TARGET_ROOT}"

if [[ -e "${TARGET_DIR}" ]]; then
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  BACKUP_DIR="${TARGET_DIR}.backup.${STAMP}.$$"
  mv "${TARGET_DIR}" "${BACKUP_DIR}"
fi

mv "${TMP_DIR}/${PLUGIN_NAME}" "${TARGET_DIR}"

echo "Installed Hermes model-provider plugin:"
echo "  source: ${SOURCE_LABEL}"
echo "  target: ${TARGET_DIR}"
if [[ -n "${BACKUP_DIR}" ]]; then
  echo "  backup: ${BACKUP_DIR}"
fi

if command -v hermes >/dev/null 2>&1; then
  if hermes plugins enable "model-providers/${PLUGIN_NAME}" >/dev/null 2>&1; then
    echo "Enabled Hermes plugin: model-providers/${PLUGIN_NAME}"
  elif hermes plugins enable "${PLUGIN_NAME}" >/dev/null 2>&1; then
    echo "Enabled Hermes plugin: ${PLUGIN_NAME}"
  else
    echo "Plugin copied. If your Hermes build requires opt-in, run:"
    echo "  hermes plugins enable model-providers/${PLUGIN_NAME}"
  fi
else
  echo "Hermes command not found in PATH. After installing Hermes, run:"
  echo "  hermes plugins enable model-providers/${PLUGIN_NAME}"
fi

echo
echo "Next:"
echo "  export GROWTHCIRCLE_API_KEY=\"<your-growthcircle-key>\""
echo "  hermes doctor"
echo "  hermes model"
