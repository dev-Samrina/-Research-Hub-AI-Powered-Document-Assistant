# backend/app/core/init_db.py
from app.core.database import engine, Base
from app.models import User, Document, Chunk  # Import models so SQLAlchemy knows about them

def create_tables():
    """Create all tables defined in the models"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    create_tables()
