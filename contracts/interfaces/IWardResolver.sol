// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWardResolver {
    function wardSigned() external pure returns (bool);
    function resolveClaimUnsigned(
        address claimant,
        address vault,
        uint256 policyId
    ) external pure returns (bool valid, string memory reason);
}
