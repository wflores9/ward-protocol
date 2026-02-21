"""
Database tests
"""
import pytest
from core.database import DatabasePool


class TestDatabasePool:
    """Test database connection pool"""
    
    def test_pool_import(self):
        """Test that DatabasePool can be imported"""
        assert DatabasePool is not None
    
    def test_pool_creation(self):
        """Test creating pool instance"""
        pool = DatabasePool()
        assert pool is not None
        assert pool.pool is None  # Not connected yet
