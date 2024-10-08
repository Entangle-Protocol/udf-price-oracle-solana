use anchor_lang::prelude::*;
use anchor_lang::solana_program::secp256k1_recover::secp256k1_recover;
use sha3::{Digest, Keccak256};

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
    let hash = Keccak256::digest(&public_key[1..]);
    let mut bytes = [0u8; 20];
    bytes.copy_from_slice(&hash[12..]);
    bytes
}
