"""
API Documentation Configuration
"""

DESCRIPTION = """
# Ward Protocol API

**Ward Protocol** is the first institutional insurance layer for XRP Ledger DeFi lending, 
featuring XLS-80 Permissioned Domains for compliance-ready capital deployment.

## Features

### Permissioned Domains (XLS-80)
- Create institutional compliance domains
- Manage credential-based access control
- Verify domain membership

### XLS-70 Credentials
- Issue and verify credentials
- Cached verification for performance
- Support for multiple credential types

### Insurance Pools
- Monitor vault health
- Automated coverage deployment
- Real-time risk assessment

## Authentication

All endpoints require API key authentication via `X-API-Key` header.

**Example:**
```bash
curl -H "X-API-Key: your_key_here" https://api.wardprotocol.org/domains
```

## Rate Limits

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Admin endpoints: Unlimited

## Support

- Documentation: https://github.com/wflores9/ward-protocol
- Issues: https://github.com/wflores9/ward-protocol/issues
"""

TAGS_METADATA = [
    {
        "name": "Public",
        "description": "Public endpoints - no authentication required"
    },
    {
        "name": "Permissioned Domains",
        "description": "XLS-80 Permissioned Domains management. Control institutional access via credentials."
    },
    {
        "name": "Admin",
        "description": "Administrative endpoints - requires admin API key with full permissions"
    },
    {
        "name": "Monitoring",
        "description": "Health checks and system monitoring"
    }
]
