use anchor_lang::prelude::*;
use derive_more::Display;
use std::{io::Write, mem::size_of};

use crate::{error::CustomError, EthAddress};

type Bytes32 = [u8; 32];

#[derive(Clone, Display, AnchorSerialize, AnchorDeserialize, Debug, Default)]
#[display(
    fmt = "{{ merkle_root: {}, data_feeds: [{}], signatures: [{}] }}",
    "hex::encode(merkle_root)",
    "data_feeds.iter().map(|feed| format!(\"{}\", feed)).collect::<Vec<String>>().join(\", \")",
    "signatures.iter().map(|signature| format!(\"{}\", signature)).collect::<Vec<String>>().join(\", \")",
)]
pub struct MultipleUpdateMessage {
    pub merkle_root: [u8; 32],
    pub data_feeds: Vec<DataFeed>,
    pub signatures: Vec<TransmitterSignature>,
}

#[derive(Clone, Display, AnchorSerialize, AnchorDeserialize, Debug, Default)]
#[display(
    fmt = "{{ merkle_root: {}, data_feed: {}, signatures: [{}] }}",
    "hex::encode(merkle_root)",
    data_feed,
    "signatures.iter().map(|signature| format!(\"{}\", signature)).collect::<Vec<String>>().join(\", \")",
)]
pub struct LastPriceMessage {
    pub merkle_root: [u8; 32],
    pub data_feed: DataFeed,
    pub signatures: Vec<TransmitterSignature>,
}

#[derive(Clone, Display, AnchorSerialize, AnchorDeserialize, Debug, Default)]
#[display(
    fmt = "{{ timestamp: {}, data_key: {}, data: {}, merkle_proof: [{}] }}",
    timestamp,
    "String::from_utf8_lossy(data_key.as_ref())",
    "hex::encode(data)",
    "merkle_proof.iter().map(hex::encode).collect::<Vec<String>>().join(\", \")"
)]
pub struct DataFeed {
    pub timestamp: u64,
    pub data_key: [u8; 32],
    pub data: [u8; 32],
    pub merkle_proof: Vec<[u8; 32]>,
}

#[derive(Clone, Display, AnchorSerialize, AnchorDeserialize, Debug)]
#[display(fmt = "{{ {:x}{}{} }}", v, "hex::encode(r)", "hex::encode(s)")]
pub struct TransmitterSignature {
    pub v: u8,
    pub r: Vec<u8>,
    pub s: Vec<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ProtocolInfo {
    is_init: bool,
    pub consensus_target_rate: u64,
    protocol_address: Pubkey,
    pub transmitters: Box<[EthAddress; 20]>,
    executors: Box<[Pubkey; 20]>,
    proposers: Box<[Pubkey; 20]>,
}

impl AccountSerialize for ProtocolInfo {
    fn try_serialize<W: Write>(&self, writer: &mut W) -> Result<()> {
        if writer.write_all(&[40, 62, 222, 136, 36, 92, 1, 233]).is_err() {
            return Err(ErrorCode::AccountDidNotSerialize.into());
        }
        if AnchorSerialize::serialize(self, writer).is_err() {
            return Err(ErrorCode::AccountDidNotSerialize.into());
        }
        Ok(())
    }
}

impl AccountDeserialize for ProtocolInfo {
    fn try_deserialize(buf: &mut &[u8]) -> Result<Self> {
        if buf.len() < [40, 62, 222, 136, 36, 92, 1, 233].len() {
            return Err(ErrorCode::AccountDiscriminatorNotFound.into());
        }

        Self::try_deserialize_unchecked(buf)
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        let mut data: &[u8] = &buf[8..];
        AnchorDeserialize::deserialize(&mut data)
            .map_err(|_| ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl anchor_lang::Discriminator for ProtocolInfo {
    // discriminator as it was defined in the photon ccm program, to make possible to read it
    const DISCRIMINATOR: [u8; 8] = [40, 62, 222, 136, 36, 92, 1, 233];
}

#[automatically_derived]
impl Owner for ProtocolInfo {
    fn owner() -> Pubkey {
        // owner as it was defined in the photon ccm program
        Pubkey::new_from_array([
            12u8, 50u8, 145u8, 223u8, 16u8, 33u8, 233u8, 37u8, 119u8, 186u8, 206u8, 30u8, 187u8,
            117u8, 189u8, 70u8, 23u8, 0u8, 141u8, 139u8, 21u8, 92u8, 169u8, 187u8, 124u8, 139u8,
            89u8, 86u8, 127u8, 197u8, 95u8, 163u8,
        ])
    }
}

impl ProtocolInfo {
    pub fn transmitters(&self) -> Vec<EthAddress> {
        self.transmitters.into_iter().take_while(|k| k != &EthAddress::default()).collect()
    }
}

#[account]
#[derive(Debug, Default)]
pub struct Config {
    pub admin: Pubkey,
    pub endpoint: Pubkey,
    pub protocol_id: [u8; 32],
}

impl Config {
    pub const LEN: usize = 8 + size_of::<Pubkey>() * 3 + size_of::<Bytes32>();
}

#[account]
#[derive(Default, Debug)]
pub struct LatestUpdate {
    pub data_key: [u8; 32],
    pub data: [u8; 32],
    pub data_timestamp: u64,
}

impl TryFrom<DataFeed> for LatestUpdate {
    type Error = CustomError;
    fn try_from(data_feed: DataFeed) -> std::result::Result<Self, Self::Error> {
        if data_feed.data.len() == 32 {
            return Err(CustomError::InconsistentData);
        };
        let mut latest_update = LatestUpdate {
            data: [0; 32],
            data_timestamp: data_feed.timestamp,
            data_key: data_feed.data_key,
        };
        latest_update.data.copy_from_slice(&data_feed.data[..32]);
        Ok(latest_update)
    }
}
