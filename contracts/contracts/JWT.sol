// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./lib/Base64.sol";
import "./lib/String.sol";

contract JWT {
    using Base64 for string;
    using String for string;

    function split(
        string memory _jwt
    ) public pure returns (string memory, string memory, string memory) {
        bytes memory jwtBytes = bytes(_jwt);
        uint256 firstDot = 0;
        uint256 secondDot = 0;

        for (uint256 i = 0; i < jwtBytes.length; i++) {
            if (jwtBytes[i] == ".") {
                if (firstDot == 0) {
                    firstDot = i;
                } else {
                    secondDot = i;
                    break;
                }
            }
        }

        require(firstDot != 0 && secondDot != 0, "Invalid JWT format");

        string memory header = _jwt.substring(0, firstDot);
        string memory payload = _jwt.substring(
            firstDot + 1,
            secondDot - firstDot - 1
        );
        string memory signature = _jwt.substring(
            secondDot + 1,
            jwtBytes.length - secondDot - 1
        );

        return (header, payload, signature);
    }

    function hashHeaderAndPayload(
        string memory _header,
        string memory _payload
    ) public pure returns (bytes32) {
        return sha256(abi.encodePacked(_header, ".", _payload));
    }

    function getKidFromHeader(
        string memory _header
    ) public pure returns (string memory) {
        bytes memory decodedHeader = _header.decode();
        string memory headerStr = string(decodedHeader);

        return getValueByKeyFromJson(headerStr, "kid");
    }

    function getAudAndEmailAndNonceFromPayload(
        string memory _payload
    ) public pure returns (string memory, string memory, string memory) {
        // Decode the payload from Base64
        bytes memory decodedPayload = _payload.decode();
        string memory payloadStr = string(decodedPayload);

        // Get the values of 'aud', 'email', and 'nonce'
        string memory aud = getValueByKeyFromJson(payloadStr, "aud");
        string memory email = getValueByKeyFromJson(payloadStr, "email");
        string memory nonce = getValueByKeyFromJson(payloadStr, "nonce");

        return (aud, email, nonce);
    }

    function getValueByKeyFromJson(
        string memory _json,
        string memory _key
    ) public pure returns (string memory) {
        bytes memory keyBytes = abi.encodePacked('"', _key, '":"');
        uint256 valueStart = _json.indexOf(keyBytes) + keyBytes.length;
        require(
            valueStart > keyBytes.length,
            string(abi.encodePacked(_key, " not found in JSON"))
        );

        uint256 valueEnd = _json
            .substring(valueStart, bytes(_json).length - valueStart)
            .indexOf('"');
        require(
            valueEnd != type(uint256).max,
            string(abi.encodePacked("Invalid ", _key, " format"))
        );

        return _json.substring(valueStart, valueEnd);
    }
}
