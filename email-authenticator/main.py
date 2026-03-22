import os
import random
import time

import resend
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

ACCESS_KEY = os.environ.get("ACCESS_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")

CODE_TTL = 600  # 10 minutes
RATE_LIMIT = 60  # 1 code per email per 60 seconds

# email -> (code, expiry_timestamp, created_timestamp)
codes: dict[str, tuple[str, float, float]] = {}


def _cleanup():
    now = time.time()
    expired = [e for e, (_, exp, _) in codes.items() if now > exp]
    for e in expired:
        del codes[e]


def _check_access_key(key: str):
    if not ACCESS_KEY:
        raise HTTPException(status_code=500, detail="Service not configured")
    if key != ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid access key")


class SendRequest(BaseModel):
    email: str
    access_key: str


class VerifyRequest(BaseModel):
    email: str
    access_key: str
    code: str


@app.post("/send-verification-mail")
async def send_verification_mail(body: SendRequest):
    _check_access_key(body.access_key)
    _cleanup()

    now = time.time()
    existing = codes.get(body.email)
    if existing and now - existing[2] < RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Please wait before requesting another code")

    code = f"{random.randint(0, 999999):06d}"
    codes[body.email] = (code, now + CODE_TTL, now)

    resend.api_key = RESEND_API_KEY
    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": body.email,
        "subject": "Your FiddleMachine verification code",
        "html": f"<p>Your verification code is: <strong>{code}</strong></p><p>This code expires in 10 minutes.</p>",
    })

    return {"ok": True}


@app.post("/verify-code")
async def verify_code(body: VerifyRequest):
    _check_access_key(body.access_key)
    _cleanup()

    existing = codes.get(body.email)
    if not existing:
        return {"valid": False}

    stored_code, expiry, _ = existing
    if time.time() > expiry:
        del codes[body.email]
        return {"valid": False}

    if body.code != stored_code:
        return {"valid": False}

    del codes[body.email]
    return {"valid": True}
