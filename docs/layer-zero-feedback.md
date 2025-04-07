## Layer Zero Feedback

### Installtion

In the [LayerZero documentation](https://docs.layerzero.network/v2/developers/evm/oapp/overview#installation), it mentions that LayerZero contracts are compatible with OpenZeppelin V4 contracts by specifying the @openzeppelin/contracts version. However, I encountered an issue and had to explicitly use the upgradeable contracts to resolve it.

Here’s what worked for me:

```
"@openzeppelin/contracts": "4.8.1",
"@openzeppelin/contracts-upgradeable": "4.8.1"
```

Additionally, I ran into a conflict with my existing ethers setup, as my project uses ethers@6, which caused compatibility issues with the LayerZero SDK. To resolve this, I added an override in my package.json:

```
"overrides": {
  "ethers": "^6.13.2"
}
```

To avoid such conflicts, separating contract-related and JavaScript-related modules in the SDK might be a potential solution.
