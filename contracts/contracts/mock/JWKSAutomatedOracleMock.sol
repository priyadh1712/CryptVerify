// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract JWKSAutomatedOracleMock {
    mapping(string => bytes) public kidToModulus;

    function setModulus(string memory _kid, bytes memory _modulus) public {
        kidToModulus[_kid] = _modulus;
    }
}
