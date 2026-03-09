#!/bin/bash
# Ward Protocol — Repo Cleanup Script
# Generated from live GitHub scan — wflores9/ward-protocol
# Run from repo root: bash ward_cleanup.sh
#
# CHANGES:
#   ward_client.py              -- 8 DNA Protocol / zk_proof refs -> XLS-96 native
#   issue_credential_option3.py -- 8 DNA Protocol / zk_proof refs -> XLS-96 native
#   README.md                   -- taxon=281 -> 282, XLS-0098 -> Discussion #474
#   vercel.json                 -- DELETE (site on Netlify)
#
# CLEAN (no changes needed):
#   REFACTOR.md, test_ward.py, docs/*.md

set -e
echo 'Ward Protocol Repo Cleanup'
echo '=================================='

# 1. DELETE vercel.json
if [ -f "vercel.json" ]; then
  git rm vercel.json
  echo "Deleted vercel.json"
else
  echo "vercel.json already gone"
fi

# 2. ward_client.py
echo "Patching ward_client.py..."
sed -i 's/DNA Protocol upgrade path: replace kyc_hash with zk_proof, same field position/v2 privacy layer: XLS-96 confidential balances + MPT selective disclosure -- XRPL native/g' ward_client.py
sed -i 's/DNA Protocol upgrade path: this function is replaced by a ZK proof/v2 privacy layer: XLS-96 confidential balances replace this function/g' ward_client.py
sed -i 's/DNA Protocol upgrade path:/v2 privacy layer (XLS-96):/g' ward_client.py
sed -i 's/When ZK proofs are available, kyc_hash is replaced by zk_proof/XLS-96 confidential balances + MPT selective disclosure replace kyc_hash/g' ward_client.py
sed -i 's/# DNA Protocol upgrade path:/# v2 privacy layer (XLS-96):/g' ward_client.py
sed -i 's/When ZK proofs are available, replace kyc_hash check with zk_proof/XLS-96 confidential balances replace kyc_hash in v2/g' ward_client.py
echo "ward_client.py patched"

# 3. issue_credential_option3.py (same patterns)
echo "Patching issue_credential_option3.py..."
sed -i 's/DNA Protocol upgrade path: replace kyc_hash with zk_proof, same field position/v2 privacy layer: XLS-96 confidential balances + MPT selective disclosure -- XRPL native/g' issue_credential_option3.py
sed -i 's/DNA Protocol upgrade path: this function is replaced by a ZK proof/v2 privacy layer: XLS-96 confidential balances replace this function/g' issue_credential_option3.py
sed -i 's/DNA Protocol upgrade path:/v2 privacy layer (XLS-96):/g' issue_credential_option3.py
sed -i 's/When ZK proofs are available, kyc_hash is replaced by zk_proof/XLS-96 confidential balances + MPT selective disclosure replace kyc_hash/g' issue_credential_option3.py
sed -i 's/# DNA Protocol upgrade path:/# v2 privacy layer (XLS-96):/g' issue_credential_option3.py
sed -i 's/When ZK proofs are available, replace kyc_hash check with zk_proof/XLS-96 confidential balances replace kyc_hash in v2/g' issue_credential_option3.py
echo "issue_credential_option3.py patched"

# 4. README.md
echo "Patching README.md..."
sed -i 's/taxon=281/taxon=282/g' README.md
sed -i 's/XRPLF PR merged -- XLS-0098 recognized standard/XRPLF PR merged -- Discussion #474 accepted as recognized standard/g' README.md
echo "README.md patched"

# 5. VERIFY
echo ""
echo "Scanning for remaining stale references..."
FOUND=$(grep -rn "DNA Protocol|zk_proof|XLS-0098" --include="*.py" --include="*.md" . 2>/dev/null | grep -v ".git" | wc -l | tr -d ' ')
if [ "$FOUND" -eq 0 ]; then
  echo "All clean -- zero stale references remaining"
else
  echo "$FOUND reference(s) still found:"
  grep -rn "DNA Protocol|zk_proof|XLS-0098" --include="*.py" --include="*.md" . | grep -v ".git"
fi

echo ""
echo "Ready to commit:"
echo '  git add -A && git commit -m "chore: remove DNA Protocol/zk_proof refs, fix taxon 281->282, drop vercel.json"'
