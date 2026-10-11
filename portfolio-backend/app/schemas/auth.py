from typing import Annotated

from pydantic import BaseModel, Field, SecretStr, StringConstraints, field_validator, model_validator


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LoginRequest(BaseModel):
    username: NonEmptyStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsernameChangeRequest(BaseModel):
    current_password: SecretStr
    new_username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    confirm_new_username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]

    @model_validator(mode="after")
    def validate_confirmation(self) -> "UsernameChangeRequest":
        if self.new_username != self.confirm_new_username:
            raise ValueError("Username confirmation does not match")
        return self


class PasswordChangeRequest(BaseModel):
    current_password: SecretStr
    new_password: SecretStr = Field(min_length=12, max_length=1024)
    confirm_new_password: SecretStr

    @model_validator(mode="after")
    def validate_confirmation(self) -> "PasswordChangeRequest":
        if self.new_password.get_secret_value() != self.confirm_new_password.get_secret_value():
            raise ValueError("Password confirmation does not match")
        return self

    @field_validator("new_password")
    @classmethod
    def validate_password_byte_length(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value().encode("utf-8")) > 1024:
            raise ValueError("Password must be no longer than 1024 UTF-8 bytes")
        return value


class AccountUpdateResponse(BaseModel):
    updated: bool = True
