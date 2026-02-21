"""Extended database pool tests for coverage improvement."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from core.database import DatabasePool


@pytest.fixture
def db():
    return DatabasePool()


@pytest.fixture
def mock_pool():
    pool = MagicMock()
    conn = AsyncMock()
    cm = AsyncMock()
    cm.__aenter__.return_value = conn
    cm.__aexit__.return_value = False
    pool.acquire.return_value = cm
    return pool, conn


class TestDatabasePoolOperations:
    @pytest.mark.asyncio
    async def test_execute(self, db, mock_pool):
        pool, conn = mock_pool
        conn.execute.return_value = "INSERT 1"
        db.pool = pool
        result = await db.execute("INSERT INTO test VALUES ($1)", "val")
        conn.execute.assert_called_once_with("INSERT INTO test VALUES ($1)", "val")
        assert result == "INSERT 1"

    @pytest.mark.asyncio
    async def test_fetch(self, db, mock_pool):
        pool, conn = mock_pool
        conn.fetch.return_value = [{"id": 1}, {"id": 2}]
        db.pool = pool
        result = await db.fetch("SELECT * FROM test")
        conn.fetch.assert_called_once()
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_fetchrow(self, db, mock_pool):
        pool, conn = mock_pool
        conn.fetchrow.return_value = {"id": 1, "name": "test"}
        db.pool = pool
        result = await db.fetchrow("SELECT * FROM test WHERE id=$1", 1)
        conn.fetchrow.assert_called_once()
        assert result["name"] == "test"

    @pytest.mark.asyncio
    async def test_fetchval(self, db, mock_pool):
        pool, conn = mock_pool
        conn.fetchval.return_value = 42
        db.pool = pool
        result = await db.fetchval("SELECT COUNT(*) FROM test")
        conn.fetchval.assert_called_once()
        assert result == 42

    @pytest.mark.asyncio
    async def test_connect(self, db):
        with patch("asyncpg.create_pool", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = AsyncMock()
            await db.connect()
            mock_create.assert_called_once()
            assert db.pool is not None

    @pytest.mark.asyncio
    async def test_disconnect(self, db):
        mock_pool = AsyncMock()
        db.pool = mock_pool
        await db.disconnect()
        mock_pool.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_disconnect_no_pool(self, db):
        db.pool = None
        await db.disconnect()
