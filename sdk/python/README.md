# Ward Protocol SDK

Python SDK for monitoring XLS-66 Lending Protocol defaults and calculating vault depositor losses.

## Installation
```bash
pip install -e .
```

## Quick Start
```python
import asyncio
from ward.monitor import XLS66Monitor, DefaultEvent

async def main():
    # Connect to XRPL
    monitor = XLS66Monitor("wss://xrplcluster.com")
    
    # Handle defaults
    @monitor.on_default
    async def handle_default(event: DefaultEvent):
        print(f"Default: {event.vault_loss / 1_000_000:.2f} XRP lost")
    
    # Start monitoring
    await monitor.start()

asyncio.run(main())
```

## Features

- ✅ Real-time XLS-66 default detection via WebSocket
- ✅ Automatic vault loss calculation
- ✅ Share value impact analysis
- ✅ LoanBroker and Vault state tracking
- ✅ Async/await support

## Examples

See `/examples` directory for complete examples.

## Documentation

Full documentation: https://github.com/wflores9/ward-protocol/docs
