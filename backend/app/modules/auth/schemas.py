"""Pydantic-схемы входа."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=4096, description="refresh_token от итд (в теле, не в URL)")
