## Impact

This repository contains a program that implements Entangle Universal Data Feeds.
It securely stores real-time data, validated by signatures from trusted transmitters that collect it from various
sources.

## Build udf_solana

#### mainnet

```
RUSTFLAGS="--cfg feature=\"mainnet\"" anchor  build  -p udf_solana
```

#### devnet, localnet

```
RUSTFLAGS="--cfg feature=\"mainnet\"" anchor  build  -p udf_solana
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
anchor deploy --program-name udf-solana --provider.cluster localnet --provider.wallet keys/owner.json --program-keypair keys/udf_solana-keypair.json
anchor deploy --program-name photon_mock --provider.cluster localnet --provider.wallet keys/owner.json --program-keypair keys/photon-keypair.json
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
