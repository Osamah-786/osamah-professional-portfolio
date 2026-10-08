import argparse
import getpass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def main() -> int:
    parser = argparse.ArgumentParser(description="Create an admin user.")
    parser.add_argument("--username", required=True, help="Admin login username")
    args = parser.parse_args()
    username = args.username.strip()
    if not username or len(username) > 100:
        parser.error("Username must be between 1 and 100 characters")

    password = getpass.getpass("Admin password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if not password or len(password.encode("utf-8")) > 1024:
        parser.error("Password must be non-empty and no longer than 1024 UTF-8 bytes")
    if password != confirmation:
        parser.error("Passwords do not match")

    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.username == username)) is not None:
            parser.error("That username already exists")
        db.add(User(username=username, password_hash=hash_password(password)))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            parser.error("That username already exists")

    print("Admin user created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
