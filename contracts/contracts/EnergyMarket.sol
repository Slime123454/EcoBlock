// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyMarket {
    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerUnit;
        string energyType;
        string location;
        uint256 timestamp;
    }

    Listing[] public listings;

    function listEnergy(
        uint256 amount,
        uint256 pricePerUnit,
        string memory energyType,
        string memory location
    ) external {
        listings.push(Listing({
            id: listings.length,
            seller: msg.sender,
            amount: amount,
            pricePerUnit: pricePerUnit,
            energyType: energyType,
            location: location,
            timestamp: block.timestamp
        }));
    }

    function getAllListings() external view returns (Listing[] memory) {
        return listings;
    }
}