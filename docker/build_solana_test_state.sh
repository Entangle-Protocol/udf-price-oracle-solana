#!/bin/sh

solana-test-validator --config solana_config.yml -q --reset &
sleep 1

anchor build
anchor deploy --program-name udf-solana --program-keypair keys/udf_solana-keypair.json --provider.wallet keys/owner.json
anchor deploy --program-name photon_mock --program-keypair keys/photon-keypair.json --provider.wallet keys/owner.json
anchor deploy --program-name price_consumer --program-keypair keys/price-consumer.json --provider.wallet keys/owner.json
anchor idl init --provider.cluster localnet --provider.wallet keys/owner.json --filepath target/idl/price_consumer.json $(solana address -k keys/price-consumer.json )
python3 fixmetadata.py
anchor test --skip-local-validator --skip-build --skip-deploy --provider.wallet keys/owner.json
