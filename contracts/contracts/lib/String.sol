// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library String {
    function substring(
        string memory _str,
        uint256 _start,
        uint256 _length
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        require(_start + _length <= strBytes.length, "Invalid substring range");

        bytes memory result = new bytes(_length);
        for (uint256 i = 0; i < _length; i++) {
            result[i] = strBytes[_start + i];
        }

        return string(result);
    }

    function indexOf(
        string memory _haystack,
        bytes memory _needle
    ) internal pure returns (uint256) {
        bytes memory haystack = bytes(_haystack);

        for (uint256 i = 0; i <= haystack.length - _needle.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < _needle.length; j++) {
                if (haystack[i + j] != _needle[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }

        return type(uint256).max;
    }

    function hexStringToBytes32(
        string memory hexString
    ) internal pure returns (bytes32) {
        bytes memory strBytes = bytes(hexString);

        // Remove the "0x" prefix if it exists
        if (strBytes.length >= 2 && strBytes[0] == "0" && strBytes[1] == "x") {
            hexString = substring(hexString, 2, strBytes.length - 2);
            strBytes = bytes(hexString);
        }

        require(strBytes.length == 64, "Invalid input length");

        bytes32 result;

        for (uint256 i = 0; i < 64; i += 2) {
            uint8 hi = uint8(hexCharToUint(strBytes[i]));
            uint8 lo = uint8(hexCharToUint(strBytes[i + 1]));
            result |= bytes32(uint256((hi << 4) | lo) << (8 * (31 - i / 2)));
        }

        return result;
    }

    function hexCharToUint(bytes1 c) internal pure returns (uint8) {
        if (uint8(c) >= 48 && uint8(c) <= 57) {
            return uint8(c) - 48;
        }
        if (uint8(c) >= 65 && uint8(c) <= 70) {
            return uint8(c) - 55;
        }
        if (uint8(c) >= 97 && uint8(c) <= 102) {
            return uint8(c) - 87;
        }
        revert("Invalid hexadecimal character");
    }
}
