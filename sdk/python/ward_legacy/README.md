# LEGACY — DO NOT USE

This subtree is quarantined and will be removed in a future release.

It contains contradictory implementations including:
- wallet storage and server-side signing (violates ward_signed = False)
- transferable NFT minting (violates non-transferable policy)
- database-backed operational logic (violates no off-chain trust)
- AMM-style routes that do not match current API

The canonical implementation is in ward/ at the repo root.
