// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "./JWT.sol";
import "./RSAPKCS1Verifier.sol";
import "./JWKSAutomatedOracle.sol";

import "./OmniExecutor.sol";

contract AuthWallet is JWT, RSAPKCS1Verifier, BaseAccount {
    using Base64 for string;
    using String for string;

    event Called();

    IEntryPoint private immutable _entryPoint;
    JWKSAutomatedOracle public immutable jwksAutomatedOracle;
    OmniExecutor public immutable omniExecutor;

    string public aud;
    string public email;

    bytes public constant EXPONENT = hex"010001"; // 65537 in hexadecimal

    modifier onlyEntryPointOrOmniExecutor() {
        require(
            msg.sender == address(entryPoint()) ||
                msg.sender == address(omniExecutor),
            "EthDriveAccount: not EntryPoint or OmniExecutor"
        );
        _;
    }

    constructor(
        IEntryPoint entryPoint_,
        JWKSAutomatedOracle _jwksAutomatedOracle,
        OmniExecutor _omniExecutor,
        string memory _aud,
        string memory _email
    ) {
        _entryPoint = entryPoint_;
        jwksAutomatedOracle = _jwksAutomatedOracle;
        omniExecutor = _omniExecutor;
        initialize(_aud, _email);
    }

    receive() external payable {}

    function initialize(
        string memory _aud,
        string memory _email
    ) public payable {
        require(
            bytes(aud).length == 0 && bytes(email).length == 0,
            "Already initialized"
        );
        aud = _aud;
        email = _email;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) public onlyEntryPointOrOmniExecutor {
        _call(to, value, data);
    }

    function executeBatch(
        address[] calldata to,
        uint256[] calldata value,
        bytes[] calldata data
    ) public onlyEntryPointOrOmniExecutor {
        require(
            to.length == data.length && value.length == data.length,
            "wrong array lengths"
        );
        for (uint256 i = 0; i < data.length; i++) {
            _call(to[i], value[i], data[i]);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit Called();
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function validateJWT(
        string memory _jwt
    ) public view returns (bool, bytes32) {
        (
            string memory header,
            string memory payload,
            string memory signature
        ) = split(_jwt);

        string memory kid = getKidFromHeader(header);
        bytes memory modulus = jwksAutomatedOracle.kidToModulus(kid);
        require(modulus.length > 0, "Modulus not found for the given kid");

        bytes32 messageHash = hashHeaderAndPayload(header, payload);
        bytes memory decodedSignature = signature.decode();

        if (!verify(messageHash, decodedSignature, EXPONENT, modulus)) {
            return (false, bytes32(0));
        }

        (
            string memory _aud,
            string memory _email,
            string memory nonce
        ) = getAudAndEmailAndNonceFromPayload(payload);

        if (
            keccak256(abi.encodePacked(aud)) !=
            keccak256(abi.encodePacked(_aud)) ||
            keccak256(abi.encodePacked(email)) !=
            keccak256(abi.encodePacked(_email))
        ) {
            return (false, bytes32(0));
        }

        return (true, nonce.hexStringToBytes32());
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        (bool isValid, bytes32 nonce) = validateJWT(string(userOp.signature));
        return (isValid && nonce == userOpHash) ? 0 : SIG_VALIDATION_FAILED;
    }
}
