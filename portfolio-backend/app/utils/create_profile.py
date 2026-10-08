"""One-time CLI to initialize the singleton profile row for the admin editor.

Run from the backend directory with ``python -m app.utils.create_profile``.
"""

import sys

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.database import SessionLocal
from app.models.profile import Profile


def main() -> int:
    with SessionLocal() as db:
        try:
            existing_profile_id = db.scalar(select(Profile.id).order_by(Profile.id).limit(1))
            if existing_profile_id is not None:
                print("A profile already exists; no changes were made.")
                return 0

            db.add(Profile(name=""))
            db.commit()
        except SQLAlchemyError:
            try:
                db.rollback()
            except SQLAlchemyError:
                pass
            print(
                "Profile initialization failed because the database operation did not complete.",
                file=sys.stderr,
            )
            return 1

    print("Created the initial empty profile. Populate it in the admin profile editor.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
