use anchor_lang::solana_program::keccak;

pub type Hash = [u8; 32];

pub fn keccak256<T: AsRef<[u8]>>(input: T) -> Hash {
    keccak::hash(input.as_ref()).0
}

pub fn keccak256_batch(inputs: &[&[u8]]) -> Hash {
    keccak::hashv(inputs).0
}

pub struct Keccak256;

impl hash_db::Hasher for Keccak256 {
    type Out = Hash;
    type StdHasher = PlaceholderHasher;
    const LENGTH: usize = 32;

    fn hash(x: &[u8]) -> Self::Out {
        keccak256(x)
    }
}

/// This hasher is never used, but it is required as a placeholder.
#[derive(Default)]
pub struct PlaceholderHasher;

impl core::hash::Hasher for PlaceholderHasher {
    fn write(&mut self, _bytes: &[u8]) {
        unimplemented!()
    }

    fn finish(&self) -> u64 {
        unimplemented!()
    }
}

pub(super) fn verify(proof: Vec<[u8; 32]>, root: [u8; 32], leaf: [u8; 32]) -> bool {
    root == process_proof(proof, leaf)
}

fn process_proof(proof: Vec<[u8; 32]>, leaf: [u8; 32]) -> [u8; 32] {
    proof.into_iter().fold(leaf, commutative_keccak256)
}

fn commutative_keccak256(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
    if a < b {
        efficient_keccak256(a, b)
    } else {
        efficient_keccak256(b, a)
    }
}

fn efficient_keccak256(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
    keccak::hashv(&[&a, &b]).0
}
