from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import MetaData, event
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    # ── Connection pool settings tuned for remote DB over slow/intermittent network ──
    pool_pre_ping=True,          # test connection before use — drops stale ones silently
    pool_size=5,                 # keep fewer persistent connections (was 10)
    max_overflow=10,             # allow bursts (was 20)
    pool_recycle=300,            # recycle connections every 5 min — prevents stale TCP
    pool_timeout=30,             # wait up to 30s for a free connection
    connect_args={
        "timeout": 10,           # asyncpg connect timeout
        "command_timeout": 60,   # per-query timeout
        "server_settings": {
            "tcp_keepalives_idle": "60",      # start keepalives after 60s idle
            "tcp_keepalives_interval": "10",  # retry every 10s
            "tcp_keepalives_count": "5",      # give up after 5 retries
        },
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    metadata = MetaData(schema=settings.POSTGRES_SCHEMA)


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
