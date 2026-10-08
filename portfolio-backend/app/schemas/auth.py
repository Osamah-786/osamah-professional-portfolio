from typing import Annotated

from pydantic import BaseModel, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LoginRequest(BaseModel):
    username: NonEmptyStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
