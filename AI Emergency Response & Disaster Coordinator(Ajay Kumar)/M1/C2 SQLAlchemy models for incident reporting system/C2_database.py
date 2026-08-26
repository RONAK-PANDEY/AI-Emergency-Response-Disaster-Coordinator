from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from models import Base

# Database URL - using SQLite
# For production, use: DATABASE_URL = "sqlite:////path/to/incidents.db"
DATABASE_URL = "sqlite:///./incidents.db"

# Create engine
# Check_same_thread=False allows multiple threads to use the connection
# StaticPool avoids connection pool issues with SQLite in some scenarios
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,  # Set to True for SQL query logging during development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency for getting database session in FastAPI or other frameworks.
    Usage in FastAPI:
        @app.get("/incidents")
        def get_incidents(db: Session = Depends(get_db)):
            return db.query(Incident).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    Call this once at application startup.
    """
    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """
    Drop all tables. Use only for testing/development!
    """
    Base.metadata.drop_all(bind=engine)


def get_session() -> Session:
    """
    Alternative to get_db() for use outside of FastAPI dependency injection.
    Useful for scripts, CLI tools, or direct database operations.
    
    Usage:
        db = get_session()
        try:
            incidents = db.query(Incident).all()
        finally:
            db.close()
    """
    return SessionLocal()