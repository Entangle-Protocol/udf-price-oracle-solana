## Impact

This repository contains a program that implements Entangle Universal Data Feeds.
It securely stores real-time data, validated by signatures from trusted transmitters that collect it from various
sources.

## Build udf_solana

The following command not only builds the udf_solana but also compiles both the photon_mock and price_consumer,
which are intended for testing purposes.

#### mainnet

The `mainnet` build is distinct as it embeds the administrator key directly within the code.

```
RUSTFLAGS="--cfg feature=\"mainnet\"" anchor build
```

#### devnet, localnet

The default build is distinct in that it embeds the administrator key, which is derived from keys/owner.json,
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

It is also possible to run standalone sample scripts provided withing the udf-samples on the github.
The first one is invoking the price-consumer program to fetch distributes within the PUSH model prices on-chain.
The second one is getting price, ensuring that price onchain withing the PULL model.

### Starting Solana test validator

```shell
solana-test-validator  --reset --config solana_config.yml 
```

### Deploying UDF price oracle contract

```shell
anchor deploy --provider.cluster localnet --program-name udf-solana --program-keypair keys/udf_solana-keypair.json --provider.wallet keys/owner.json && anchor deploy --provider.cluster localnet --program-name price_consumer --program-keypair keys/price-consumer.json --provider.wallet keys/owner.json && anchor deploy --provider.cluster localnet --program-name photon_mock --program-keypair keys/photon-keypair.json --provider.wallet keys/owner.json
```

### Running tests

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

### Checking UDF protocol info account

```shell
anchor account --provider.cluster localnet  --provider.wallet keys/owner.json photon.ProtocolInfo 3S41QhsrzERXpFuAiJD2uZbUqEyvS2FYHPHKak6MKMdr | jq -c
```

### Checking latest update

```shell
anchor account --provider.cluster localnet  --provider.wallet keys/owner.json udf_solana.LatestUpdate GdhgwM9UP19849bDkyAEiEre5prTNWbMMKWDonJEvkCU | jq -c
```

```
{
    "data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,251,78,3,14,123],
    "dataKey":[71,65,83,45,69,84,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "dataTimestamp":1721300185
}
```
