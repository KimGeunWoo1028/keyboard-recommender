from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    message: str = Field(min_length=1, max_length=4000)
    # Honeypot — must stay empty; bots that fill it get a soft success without send.
    company: str = Field(default="", max_length=200)


class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sent: bool
    delivery: str
