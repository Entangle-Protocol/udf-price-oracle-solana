use std::slice;
use udf_solana::data::{DataFeed, MultipleUpdateMessage, TransmitterSignature};

#[derive(Clone, Debug)]
#[repr(C)]
pub(crate) struct MerkleRootUpdateMultiple {
    pub(crate) merkle_root: [u8; 32],
    pub(crate) signatures: *const EcdsaSignature,
    pub(crate) signatures_len: usize,
    pub(crate) updates: *const MultipleUpdateData,
    pub(crate) updates_len: usize,
}

#[derive(Clone, Debug)]
#[repr(C)]
pub(crate) struct EcdsaSignature {
    pub(crate) r: [u8; 32],
    pub(crate) s: [u8; 32],
    pub(crate) v: u8,
}

#[derive(Clone, Debug, Default)]
#[repr(C)]
pub(crate) struct LatestUpdate {
    pub(crate) price: [u8; 32],
    pub(crate) timestamp: u64,
}

impl From<&EcdsaSignature> for TransmitterSignature {
    fn from(value: &EcdsaSignature) -> Self {
        TransmitterSignature {
            s: value.s.to_vec(),
            r: value.r.to_vec(),
            v: value.v,
        }
    }
}

#[derive(Clone, Debug)]
#[repr(C)]
pub(crate) struct MultipleUpdateData {
    pub(crate) data_key: [u8; 32],
    pub(crate) merkle_proof: *const [u8; 32],
    pub(crate) merkle_proof_len: usize,
    pub(crate) price: [u8; 32],
    pub(crate) timestamp: u64,
}

impl From<&MultipleUpdateData> for DataFeed {
    fn from(value: &MultipleUpdateData) -> Self {
        let merkle_proof: &[[u8; 32]] =
            unsafe { slice::from_raw_parts(value.merkle_proof, value.merkle_proof_len) };
        DataFeed {
            timestamp: value.timestamp,
            data_key: value.data_key,
            data: value.price,
            merkle_proof: merkle_proof.to_vec(),
        }
    }
}

impl From<&MerkleRootUpdateMultiple> for MultipleUpdateMessage {
    fn from(data: &MerkleRootUpdateMultiple) -> Self {
        let signatures: &[EcdsaSignature] =
            unsafe { slice::from_raw_parts(data.signatures, data.signatures_len) };

        let updates: &[MultipleUpdateData] =
            unsafe { slice::from_raw_parts(data.updates, data.updates_len) };

        MultipleUpdateMessage {
            merkle_root: data.merkle_root,
            data_feeds: updates.iter().map(DataFeed::from).collect(),
            signatures: signatures.iter().map(TransmitterSignature::from).collect(),
        }
    }
}
