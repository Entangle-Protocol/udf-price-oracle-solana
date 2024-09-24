use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("Is not admin")]
    IsNotAdmin,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Consensus not reached")]
    ConsensusNotReached,
    #[msg("Merkle proof not verified")]
    MerkleProofNotVerified,
    #[msg("Inconsistent data")]
    InconsistentData,
}
