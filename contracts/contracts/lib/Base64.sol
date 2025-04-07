// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Base64 {
    function decode(
        string memory _base64
    ) internal pure returns (bytes memory) {
        bytes memory base64 = bytes(_base64);
        uint256 len = base64.length;
        require(len > 0, "Empty input");

        // Check for padding characters and adjust length accordingly
        if (base64[len - 1] == "=") len--;
        if (base64[len - 1] == "=") len--;

        uint256 outputLen = (len * 3) / 4;

        bytes memory result = new bytes(outputLen);
        uint256 j = 0;

        for (uint256 i = 0; i < len; i += 4) {
            uint256 n = getBase64UrlValue(base64[i]) << 18;
            if (i + 1 < len) n += getBase64UrlValue(base64[i + 1]) << 12;
            if (i + 2 < len) n += getBase64UrlValue(base64[i + 2]) << 6;
            if (i + 3 < len) n += getBase64UrlValue(base64[i + 3]);

            if (j < outputLen) result[j++] = bytes1(uint8(n >> 16));
            if (j < outputLen) result[j++] = bytes1(uint8(n >> 8));
            if (j < outputLen) result[j++] = bytes1(uint8(n));
        }

        return result;
    }

    function getBase64UrlValue(bytes1 _char) private pure returns (uint256) {
        uint8 charCode = uint8(_char);
        if (charCode >= 65 && charCode <= 90) return charCode - 65; // A-Z
        if (charCode >= 97 && charCode <= 122) return charCode - 71; // a-z
        if (charCode >= 48 && charCode <= 57) return charCode + 4; // 0-9
        if (charCode == 45) return 62; // -
        if (charCode == 95) return 63; // _
        revert("Invalid base64url character");
    }
}
