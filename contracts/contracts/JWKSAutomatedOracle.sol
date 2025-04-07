// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./lib/Base64.sol";

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract JWKSAutomatedOracle is FunctionsClient, ConfirmedOwner, AutomationCompatibleInterface {
    using FunctionsRequest for FunctionsRequest.Request;

    event ModulusReceived(string indexed kid, bytes modulus);
    error UnexpectedRequestID(bytes32 requestId);

    // Chainlink Functions Data
    string public kidSource =
        "const { Buffer } = await import('node:buffer');"
        "const index = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: 'https://www.googleapis.com/oauth2/v3/certs'"
        "});"
        "if (apiResponse.error) {"
        "throw Error('Request failed');"
        "}"
        "const { data } = apiResponse;"
        "return Functions.encodeString(data.keys[index].kid);";

    string public modulusSource =
        "const { Buffer } = await import('node:buffer');"
        "const kid = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: 'https://www.googleapis.com/oauth2/v3/certs'"
        "});"
        "if (apiResponse.error) {"
        "throw Error('Request failed');"
        "}"
        "const { data } = apiResponse;"
        "const jwk = data.keys.find((jwk) => jwk.kid == kid);"
        "return Buffer.from(jwk.n, 'base64');";

    bytes32 public donID;
    uint64 public subscriptionId;
    uint32 public gasLimit;

    // Chainlink Automation Data
    uint256 public interval = 1 hours;
    uint256 public lastTimeStamp;

    // App Data
    mapping(bytes32 => string) public requestIdToKid;
    mapping(string => bytes) public kidToModulus;

    constructor(
        address _router,
        bytes32 _donID,
        uint64 _subscriptionId,
        uint32 _gasLimit
    ) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        donID = _donID;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
    }

    // Chainlink Functions Methods
    function fulfillRequest(
        bytes32 _requestId,
        bytes memory _response,
        bytes memory
    ) internal override {
        if (bytes(requestIdToKid[_requestId]).length == 0) {
            string memory kidStr = string(_response);
            if (bytes(kidToModulus[kidStr]).length == 0) {
                _requestModulus(kidStr);
            }
        } else {
            string memory kid = requestIdToKid[_requestId];
            kidToModulus[kid] = _response;
            emit ModulusReceived(kid, _response);
        }
    }

    function _requestKid(string memory index) internal {
        FunctionsRequest.Request memory req;
        string[] memory args = new string[](1);
        args[0] = index;
        req.setArgs(args);
        req.initializeRequestForInlineJavaScript(kidSource);
        _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
    }

    function _requestModulus(string memory kid) internal {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(modulusSource);
        string[] memory args = new string[](1);
        args[0] = kid;
        req.setArgs(args);
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        requestIdToKid[requestId] = kid;
    }

    // Chainlink Automation Methods
    function checkUpkeep(
        bytes calldata
    ) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            _requestKid("0");
            _requestKid("1");
        }
    }

    // Public function to manually trigger JWKS fetch
    function triggerJWKSFetch() external {
        _requestKid("0");
        _requestKid("1");
    }

    // Function to update subscription ID
    function setSubscriptionId(uint64 _newSubscriptionId) external onlyOwner {
        subscriptionId = _newSubscriptionId;
    }
}
