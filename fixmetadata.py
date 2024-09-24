import json, sys

udf = "./target/idl/udf_solana.json"
photon_mock = "./target/idl/photon_mock.json"
price_consumer = "./target/idl/price_consumer.json"

def fix(path, address):
    metadata = json.loads(open(path, "r").read())
    metadata["metadata"] = {}
    metadata["metadata"]["address"] = address
    open(path, "w").write(json.dumps(metadata))

fix(udf, "7HramSnctpbXqZ4SEzqvqteZdMdj3tEB2c9NT7egPQi7")
fix(photon_mock, "pccm961CjaR7T7Hcht9omrXQb9w54ntJo95FFT7N9AJ")
fix(price_consumer, "3r5ixGQu8DRmJWgFEjwnDUQ6yasfYFXDsUbqkA6gkRtv")
