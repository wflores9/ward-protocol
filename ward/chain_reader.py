"""
Chain reader for Ward Protocol - XRPL ledger and account queries.

Provides read-only access to account info, balances, ledger entries,
and escrow objects.
"""

from typing import Optional, Dict, List, Any
from dataclasses import dataclass

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.models.requests import AccountInfo, AccountObjects, AccountTx


@dataclass
class AccountBalance:
    """Account balance result."""

    address: str
    balance_drops: int
    sequence: int

    @property
    def balance_xrp(self) -> float:
        return self.balance_drops / 1_000_000


@dataclass
class EscrowInfo:
    """Escrow object info."""

    sequence: int
    amount_drops: int
    destination: str
    finish_after: str
    cancel_after: str
    owner: str


class ChainReader:
    """
    Read-only XRPL chain access for Ward Protocol.

    Requires an AsyncWebsocketClient for queries.
    """

    def __init__(self, client: AsyncWebsocketClient):
        self.client = client

    async def get_account_balance(self, address: str) -> AccountBalance:
        """
        Get XRP balance and sequence for an address.

        Args:
            address: XRPL classic address

        Returns:
            AccountBalance with balance_drops and sequence
        """
        request = AccountInfo(account=address)
        response = await self.client.request(request)
        if not response.is_successful():
            raise ValueError(f"AccountInfo failed: {response.result}")
        data = response.result["account_data"]
        return AccountBalance(
            address=address,
            balance_drops=int(data["Balance"]),
            sequence=data.get("Sequence", 0),
        )

    async def verify_account_exists(self, address: str) -> bool:
        """Check if an account exists on the ledger."""
        try:
            await self.get_account_balance(address)
            return True
        except Exception:
            return False

    async def get_account_objects(
        self,
        address: str,
        *,
        obj_type: Optional[str] = None,
        limit: int = 400,
    ) -> List[Dict[str, Any]]:
        """
        Get account-owned ledger objects.

        Args:
            address: Account address
            obj_type: Optional filter (e.g. "escrow", "offer", "check")
            limit: Max objects to return

        Returns:
            List of raw account objects
        """
        params: Dict[str, Any] = {"account": address, "limit": limit}
        if obj_type:
            params["type"] = obj_type
        request = AccountObjects(**params)
        response = await self.client.request(request)
        if not response.is_successful():
            raise ValueError(f"AccountObjects failed: {response.result}")
        return response.result.get("account_objects", [])

    async def get_escrows(self, address: str) -> List[EscrowInfo]:
        """
        Get all escrow objects for an account.

        Args:
            address: Owner address

        Returns:
            List of EscrowInfo
        """
        objs = await self.get_account_objects(address, obj_type="escrow")
        escrows = []
        for obj in objs:
            if obj.get("LedgerEntryType") != "Escrow":
                continue
            escrows.append(
                EscrowInfo(
                    sequence=obj.get("Sequence", 0),
                    amount_drops=int(obj.get("Amount", 0)),
                    destination=obj.get("Destination", ""),
                    finish_after=obj.get("FinishAfter", ""),
                    cancel_after=obj.get("CancelAfter", ""),
                    owner=obj.get("Account", address),
                )
            )
        return escrows

    async def get_account_transactions(
        self,
        address: str,
        *,
        limit: int = 20,
        ledger_index_min: int = -1,
        ledger_index_max: int = -1,
    ) -> List[Dict[str, Any]]:
        """
        Get recent transactions for an account.

        Args:
            address: Account address
            limit: Max transactions
            ledger_index_min: Min ledger (default -1 = earliest)
            ledger_index_max: Max ledger (default -1 = latest)

        Returns:
            List of transaction objects
        """
        request = AccountTx(
            account=address,
            ledger_index_min=ledger_index_min,
            ledger_index_max=ledger_index_max,
            limit=limit,
        )
        response = await self.client.request(request)
        if not response.is_successful():
            raise ValueError(f"AccountTx failed: {response.result}")
        return response.result.get("transactions", [])
