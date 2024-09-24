## Impact

This repository contains a program that implements Entangle Universal Data Feeds.
It securely stores real-time data, validated by signatures from trusted transmitters that collect it from various
sources.

## Build udf_solana

#### mainnet

```
RUSTFLAGS="--cfg feature=\"mainnet\"" anchor build
```

#### devnet, localnet

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
