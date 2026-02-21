"""
Ward Protocol - Permissioned Domains (XLS-80)

Institutional compliance layer for insurance pools using XRPL Permissioned Domains.
Enables KYC/AML-compliant access control through credential-based permissioning.
"""

import hashlib
import structlog
from typing import Dict, List, Optional, Any
from xrpl.models import PermissionedDomainSet, PermissionedDomainDelete
from xrpl.models.transactions.deposit_preauth import Credential
from xrpl.wallet import Wallet
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.asyncio.clients import AsyncWebsocketClient

logger = structlog.get_logger()


class PermissionedDomainManager:
    """
    Manages XLS-80 Permissioned Domains for institutional access control.
    """
    
    def __init__(self, xrpl_client: AsyncWebsocketClient):
        self.client = xrpl_client
        self.logger = logger.bind(module="permissioned_domains")
    
    def generate_domain_id(self, owner: str, sequence: int) -> str:
        """Generate DomainID hash per XLS-80 specification."""
        space_key = "PD"
        data = f"{space_key}{owner}{sequence}".encode()
        domain_hash = hashlib.sha512(data).hexdigest()
        return domain_hash[:64]
    
    def _encode_credential_type(self, credential_type: str) -> str:
        """
        Encode credential type to hex string.
        
        Per XLS-70/80 spec, CredentialType must be hex-encoded.
        """
        return credential_type.encode('utf-8').hex().upper()
    
    async def create_domain(
        self,
        wallet: Wallet,
        accepted_credentials: List[Dict[str, str]],
        domain_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create or modify a permissioned domain on XRPL.
        
        Args:
            wallet: Wallet to sign transaction
            accepted_credentials: List with format [{"issuer": "rAddr", "credential_type": "TYPE"}]
            domain_id: Optional existing domain to modify
            
        Returns:
            Dict with domain_id, transaction hash, and result
        """
        self.logger.info(
            "creating_permissioned_domain",
            owner=wallet.classic_address,
            num_credentials=len(accepted_credentials)
        )
        
        if not accepted_credentials or len(accepted_credentials) > 10:
            raise ValueError("AcceptedCredentials must have 1-10 entries")
        
        # Create Credential objects with hex-encoded types
        formatted_credentials = []
        for cred in accepted_credentials:
            if "issuer" not in cred or "credential_type" not in cred:
                raise ValueError("Each credential needs issuer and credential_type")
            
            # Encode credential type to hex
            hex_type = self._encode_credential_type(cred["credential_type"])
            
            # Check max length (64 bytes = 128 hex chars)
            if len(hex_type) > 128:
                raise ValueError(f"CredentialType too long: {cred['credential_type']}")
            
            # Create Credential object
            credential_obj = Credential(
                issuer=cred["issuer"],
                credential_type=hex_type
            )
            formatted_credentials.append(credential_obj)
        
        # Build transaction
        tx_params = {
            "account": wallet.classic_address,
            "accepted_credentials": formatted_credentials
        }
        
        if domain_id:
            tx_params["domain_id"] = domain_id
        
        tx = PermissionedDomainSet(**tx_params)
        
        try:
            result = await submit_and_wait(tx, self.client, wallet)
            
            if result.is_successful():
                sequence = result.result.get("Sequence", 0)
                generated_domain_id = self.generate_domain_id(
                    wallet.classic_address,
                    sequence
                )
                
                self.logger.info(
                    "domain_created",
                    domain_id=generated_domain_id,
                    tx_hash=result.result["hash"]
                )
                
                return {
                    "success": True,
                    "domain_id": generated_domain_id,
                    "tx_hash": result.result["hash"],
                    "owner": wallet.classic_address,
                    "sequence": sequence,
                    "accepted_credentials": accepted_credentials
                }
            else:
                error = result.result.get("engine_result", "Unknown error")
                self.logger.error("domain_creation_failed", error=error)
                return {
                    "success": False,
                    "error": error
                }
        
        except Exception as e:
            self.logger.error("domain_creation_exception", error=str(e))
            raise
    
    async def delete_domain(
        self,
        wallet: Wallet,
        domain_id: str
    ) -> Dict[str, Any]:
        """Delete a permissioned domain (only owner can delete)."""
        self.logger.info("deleting_domain", domain_id=domain_id)
        
        tx = PermissionedDomainDelete(
            account=wallet.classic_address,
            domain_id=domain_id
        )
        
        try:
            result = await submit_and_wait(tx, self.client, wallet)
            
            if result.is_successful():
                return {
                    "success": True,
                    "tx_hash": result.result["hash"],
                    "domain_id": domain_id
                }
            else:
                return {
                    "success": False,
                    "error": result.result.get("engine_result", "Transaction failed")
                }
        
        except Exception as e:
            self.logger.error("domain_deletion_exception", error=str(e))
            raise


def log_domain_configuration():
    """Log permissioned domain configuration on startup"""
    logger.info(
        "permissioned_domains_configured",
        xls_standard="XLS-80",
        status="enabled"
    )
