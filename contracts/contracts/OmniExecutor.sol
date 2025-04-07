// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

import "./AuthWallet.sol";

interface IAuthWalletFactory {
    function getDeployedAddress(
        string memory aud,
        string memory email,
        uint256 salt
    ) external view returns (address);

    function createAccount(
        string memory aud,
        string memory email,
        uint256 salt
    ) external view returns (address);
}

contract OmniExecutor is OApp {
    IAuthWalletFactory public factory;

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) {
        _transferOwnership(_owner);
    }

    function setFactory(IAuthWalletFactory _factory) external onlyOwner {
        factory = _factory;
    }

    function send(
        uint32 _dstEid,
        address to,
        uint256 value,
        bytes calldata data,
        bytes calldata _options
    ) external payable {
        AuthWallet authWallet = AuthWallet(payable(msg.sender));
        string memory aud = authWallet.aud();
        string memory email = authWallet.email();
        bytes memory _payload = abi.encode(aud, email, to, value, data);
        _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal override {
        (
            string memory aud,
            string memory email,
            address to,
            uint256 value,
            bytes memory data
        ) = abi.decode(payload, (string, string, address, uint256, bytes));
        address account = factory.getDeployedAddress(aud, email, 0);
        if (!isContract(account)) {
            factory.createAccount(aud, email, 0);
        }
        AuthWallet(payable(account)).execute(to, value, data);
    }

    function isContract(address account) public view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}
