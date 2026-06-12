from __future__ import annotations

import hashlib
import secrets


def generate_preimage() -> str:
    return secrets.token_hex(32)


def generate_payment_hash(preimage: str) -> str:
    return hashlib.sha256(bytes.fromhex(preimage)).hexdigest()


def validate_preimage(preimage: str) -> bool:
    if len(preimage) != 64:
        return False
    try:
        bytes.fromhex(preimage)
        return True
    except ValueError:
        return False
