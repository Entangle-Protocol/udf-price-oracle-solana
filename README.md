## The price oracle solana implementation

This repository consists of both the program implementing the Entangle Universal Data Feeds (UDF) and a plugin used
within
the [Pull Update Publisher](https://github.com/Entangle-Protocol/udf-update-publisher) facility to interact with Solana,
as one out of the many blockchains are supposed to receive price feeds.

The [price oracle program](./programs/udf-solana) securely stores real-time data, validated by signatures from trusted
transmitters who gather it
from multiple sources.

The [Pull Update Publisher plugin](./price-publisher) is loaded as a shared library at runtime and
communicates [with the main application](https://github.com/Entangle-Protocol/udf-update-publisher) through the Foreign
Function Interface (FFI).
This plugin uses the received data feeds to construct, execute, and process the results of Solana transactions, ensuring
that the data is properly transmitted and validated on the blockchain.

## Build udf_solana

The following command not only builds the udf_solana but also compiles both the `photon_mock` and `price_consumer`,
which are intended for testing purposes.

### mainnet

The `mainnet` build feature is distinct as it embeds the administrator public key directly within the code.

```
RUSTFLAGS="--cfg feature=\"mainnet\"" anchor build
```

### devnet, localnet

The default build is distinct in that it embeds the testing administrator public key, which is derived from
keys/owner.json,
directly within the code.

```
anchor build
```

## Building publisher lib

Publisher lib is used as a plugin for pull update publisher service that publishes prices to the multiple chains.
It's supposed that pull update publisher source directory exists at the given path

```
cargo build --release -Z unstable-options -p price-publisher --out-dir ../pull-update-publisher
```

## Testing udf locally

Testing the udf_solana program allows us to ensure it works in the same way on the mainnet. It assumes starting
the solana validator locally, deploying programs in it and running tests.

It is also possible to run standalone sample scripts provided within
the [udf-samples on the github](https://github.com/Entangle-Protocol/udf-examples).

### Starting Solana test validator

The local Solana test validator is supposed to be started to make it able to deploy contracts and to initialize the
testing state on it.

```shell
solana-test-validator  --reset --config solana_config.yml 
```

### Deploying UDF price oracle contract

The next step involves deploying the udf-solana, price_consumer, and photon_mock programs in sequence:

- udf-solana: This is the price oracle program that defines the rules for how and where price feeds are validated and
  stored on-chain. It serves as the backbone for ensuring the accuracy and security of price data within the network.
- price_consumer: This is a sample contract designed to demonstrate how client contracts can be structured and
  implemented. It shows how external developers can integrate price-consuming functionality into their own programs.
- photon_mock: This is a mock version of the Photon CCM, used for testing purposes. It simulates the behavior of the
  real Photon CCM by providing a set of fake transmitters responsible for validating price feed signatures, enabling a
  controlled environment for testing price validation.

By deploying these programs in turn, you can set up a functional environment for testing and demonstrating how the price
feeds are managed and validated on the Solana blockchain.

```shell
anchor deploy --provider.cluster localnet --program-name udf-solana --program-keypair keys/udf_solana-keypair.json --provider.wallet keys/owner.json && \
anchor deploy --provider.cluster localnet --program-name price_consumer --program-keypair keys/price-consumer.json --provider.wallet keys/owner.json && \
anchor deploy --provider.cluster localnet --program-name price_consumer_pull --program-keypair keys/price_consumer_pull-keypair.json --provider.wallet keys/owner.json && \
anchor deploy --provider.cluster localnet --program-name photon_mock --program-keypair keys/photon-keypair.json --provider.wallet keys/owner.json
```

### Running tests

During the subsequent process, both the PULL and PUSH UDF models are tested. This step also sets up the initial local
environment, which can be used for further interactions by sample client programs. By creating this environment,
developers can test and demonstrate how the UDF models operate in different scenarios, ensuring seamless integration
and functionality for both models within the system.

```shell
anchor test --skip-deploy --skip-build --skip-local-validator --provider.wallet keys/owner.json
```

### Publishing anchor IDL

Publishing the Anchor IDL for the price consumer sample program stores the IDL on-chain at the program-derived address
(PDA) based on the program's initial address. This allows clients to interact with the price consumer program without
embedding the IDL in the client code.

```shell
anchor idl init --provider.cluster localnet --provider.wallet keys/owner.json --filepath target/idl/price_consumer.json 3r5ixGQu8DRmJWgFEjwnDUQ6yasfYFXDsUbqkA6gkRtv
Idl account created: 4f64qnq9kq1cYcoRgoQZbi1pjMxj3ZPwUNEijm4oVh6Y

anchor idl init --provider.cluster localnet --provider.wallet keys/owner.json --filepath target/idl/udf_solana.json 7HramSnctpbXqZ4SEzqvqteZdMdj3tEB2c9NT7egPQi7
Idl account created: GHbMd8b8AkXcyaHsRx7dKHSf5QR1RJYbi1ngaY9aXCz9
```

### Checking accounts using anchor CLI

In some cases, it can be helpful to verify whether the accounts specified in the Solana programs are initialized
correctly.
For testing purposes, the Anchor SDK provides CLI commands that allow us to check if an account is structured and
initialized as expected.

For example, to check the ProtocolInfo account defined within the photon_mock program, you can use the following
command:

```shell
anchor account --provider.cluster localnet  --provider.wallet keys/owner.json photon.ProtocolInfo 3S41QhsrzERXpFuAiJD2uZbUqEyvS2FYHPHKak6MKMdr | jq -c
```

This command fetches the account data and formats it using jq to provide a compact JSON view. Additionally, if it's
necessary
to check the latest update without creating a client project, similar commands can be used to inspect the state of the
relevant on-chain accounts, ensuring the data is correctly stored and accessible. This approach allows for quick
verification without the need for a full client-side implementation.

```shell
anchor account --provider.cluster localnet  --provider.wallet keys/owner.json udf_solana.LatestUpdate GdhgwM9UP19849bDkyAEiEre5prTNWbMMKWDonJEvkCU | jq -c
{
    "data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,251,78,3,14,123],
    "dataKey":[71,65,83,45,69,84,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "dataTimestamp":1721300185
}
```

