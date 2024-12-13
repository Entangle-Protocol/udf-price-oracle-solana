use anchor_lang::{
    prelude::*,
    solana_program::{keccak, secp256k1_recover::secp256k1_recover},
};

use crate::data::TransmitterSignature;
use crate::error::CustomError;
use crate::EthAddress;

pub fn ecrecover(hash: &[u8], sig: &TransmitterSignature) -> anchor_lang::Result<EthAddress> {
    let signature = [&sig.r[..], &sig.s[..]].concat();
    let v = sig.v % 27;
    require_eq!(signature.len(), 64);
    let pk = secp256k1_recover(hash, v, &signature).map_err(|_| CustomError::InvalidSignature)?;
    Ok(derive_eth_address(&[&[0x04], &pk.0[..]].concat()))
}

pub fn derive_eth_address(public_key: &[u8]) -> EthAddress {
    let hash = keccak::hash(&public_key[1..]).0;
    let mut bytes = [0u8; 20];
    bytes.copy_from_slice(&hash[12..]);
    bytes
}
