// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract RSAPKCS1Verifier {
    /// @notice Verifies an RSA signature using PKCS#1 v1.5 padding
    /// @param _message The original message hash (32 bytes)
    /// @param _signature The RSA signature to verify
    /// @param _exponent The public exponent of the RSA key
    /// @param _modulus The modulus of the RSA key
    /// @return bool True if the signature is valid, false otherwise
    function verify(
        bytes32 _message,
        bytes memory _signature,
        bytes memory _exponent,
        bytes memory _modulus
    ) public view returns (bool) {
        // Prepare input for the modular exponentiation precompile
        bytes memory input = abi.encodePacked(
            uint256(_signature.length),
            uint256(_exponent.length),
            uint256(_modulus.length),
            _signature,
            _exponent,
            _modulus
        );

        // Call the modular exponentiation precompile (address 0x05)
        (bool success, bytes memory result) = address(0x05).staticcall(input);
        require(success, "Modular exponentiation failed");

        // Verify PKCS#1 v1.5 padding structure
        // The result should start with 0x00 0x01
        if (result.length < 11 || result[0] != 0x00 || result[1] != 0x01) {
            return false;
        }

        // Find the end of the padding (0xFF bytes)
        uint256 paddingEnd = 2;
        while (paddingEnd < result.length && result[paddingEnd] == 0xFF) {
            paddingEnd++;
        }

        // Verify that the padding is followed by a 0x00 byte
        if (paddingEnd + 1 >= result.length || result[paddingEnd] != 0x00) {
            return false;
        }

        // Extract the ASN.1-encoded structure (after 0x00)
        uint256 startIndex = paddingEnd + 1;
        uint256 asn1EndIndex = result.length;

        // The first 19 bytes after padding are the ASN.1 prefix for SHA-256
        if (asn1EndIndex - startIndex < 19) {
            return false; // Not enough data for ASN.1 prefix
        }

        // Extract and verify ASN.1 structure
        bytes memory asn1Prefix = hex"3031300d060960864801650304020105000420"; // ASN.1 prefix for SHA-256
        for (uint256 i = 0; i < 19; i++) {
            if (result[startIndex + i] != asn1Prefix[i]) {
                return false; // Invalid ASN.1 structure
            }
        }

        // Extract the raw SHA-256 hash from the result
        bytes32 extractedHash;
        for (uint256 i = 0; i < 32; i++) {
            extractedHash |=
                bytes32(result[startIndex + 19 + i] & 0xFF) >>
                (i * 8);
        }

        // Compare the extracted hash with the provided message hash
        return extractedHash == _message;
    }
}
