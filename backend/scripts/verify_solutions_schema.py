from sqlalchemy import text

from app.core.database import SessionLocal

db = SessionLocal()
try:
    status_col = db.execute(
        text(
            "select column_name from information_schema.columns "
            "where table_name='job_problems' and column_name='status'"
        )
    ).scalar()
    solutions = db.execute(text("select count(1) from job_solutions")).scalar()
    by_status = db.execute(text("select status::text, count(1) from job_problems group by 1")).all()
    print("status_col", status_col)
    print("solutions", solutions)
    print("by_status", by_status)
finally:
    db.close()
