// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./AuthWallet.sol";

contract AuthWalletFactory {
    AuthWallet public immutable accountImplementation;

    constructor(
        IEntryPoint _entryPoint,
        JWKSAutomatedOracle _jwksAutomatedOracle,
        OmniExecutor _omniExecutor
    ) {
        accountImplementation = new AuthWallet(
            _entryPoint,
            _jwksAutomatedOracle,
            _omniExecutor,
            "aud",
            "email"
        );
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(
        string memory aud,
        string memory email,
        uint256 salt
    ) public returns (AuthWallet ret) {
        address addr = getDeployedAddress(aud, email, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return AuthWallet(payable(addr));
        }
        ret = AuthWallet(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(AuthWallet.initialize, (aud, email))
                )
            )
        );
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getDeployedAddress(
        string memory aud,
        string memory email,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(AuthWallet.initialize, (aud, email))
                        )
                    )
                )
            );
    }
}
