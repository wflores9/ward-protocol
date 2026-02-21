"""
Database operations with connection pooling and async support
"""

import asyncpg
from typing import Optional, Dict, List
import structlog
from datetime import datetime

logger = structlog.get_logger()


class DatabasePool:
    """Async PostgreSQL connection pool"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        
    async def connect(self,
                     host: str = "localhost",
                     database: str = "ward_protocol",
                     user: str = "ward_user",
                     password: str = "ward_protocol_2026",
                     min_size: int = 10,
                     max_size: int = 20):
        """Initialize connection pool"""
        
        self.pool = await asyncpg.create_pool(
            host=host,
            database=database,
            user=user,
            password=password,
            min_size=min_size,
            max_size=max_size
        )
        
        logger.info("database_pool_created",
                   min_size=min_size,
                   max_size=max_size)
    
    async def disconnect(self):
        """Close all connections"""
        if self.pool:
            await self.pool.close()
            logger.info("database_pool_closed")
    
    async def execute(self, query: str, *args):
        """Execute a query"""
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args) -> List:
        """Fetch multiple rows"""
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args) -> Optional[Dict]:
        """Fetch single row"""
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """Fetch single value"""
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)


# Global database pool
db_pool = DatabasePool()


# Startup/Shutdown hooks
async def startup_database():
    """Initialize database pool on startup"""
    await db_pool.connect()
    logger.info("database_startup_complete")


async def shutdown_database():
    """Close database pool on shutdown"""
    await db_pool.disconnect()
    logger.info("database_shutdown_complete")
