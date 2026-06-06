// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IWardResolver.sol";

contract WardResolver is IWardResolver {
    uint256 public constant WARD_POLICY_TAXON = 281;
    uint256 public constant LSF_LOAN_DEFAULT = 0x00010000;

    bool private constant _wardSigned = false;

    function wardSigned() external pure override returns (bool) {
        return _wardSigned;
    }

    function resolveClaimUnsigned(
        address claimant,
        address vault,
        uint256 policyId
    ) external pure override returns (bool valid, string memory reason) {
        if (claimant == address(0)) return (false, "Check 8: claimant is zero address");
        if (vault == address(0)) return (false, "Check 3: vault is zero address");
        if (policyId == 0) return (false, "Check 1: invalid policy NFT");

        return (true, "RESOLVED: ward_signed=False");
    }
}
