use anchor_lang::prelude::*;

declare_id!("pccm961CjaR7T7Hcht9omrXQb9w54ntJo95FFT7N9AJ");

const UDF_PROTOCOL_ID: &[u8] = b"universal-data-feeds3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";
pub const ROOT: &[u8] = b"r0";

pub type EthAddress = [u8; 20];

#[program]
pub mod photon_mock {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, transmitters: Vec<EthAddress>) -> Result<()> {
        ctx.accounts.protocol_info.transmitters = Default::default();
        for (i, k) in transmitters.into_iter().enumerate() {
            ctx.accounts.protocol_info.transmitters[i] = k;
        }
        ctx.accounts.protocol_info.consensus_target_rate = 10000;
        Ok(())
    }
}
#[account]
#[derive(Default)]
pub struct ProtocolInfo {
    is_init: bool,
    consensus_target_rate: u64,
    protocol_address: Pubkey,
    transmitters: Box<[EthAddress; 20]>, // cannot use const with anchor
    executors: Box<[Pubkey; 20]>,
    proposers: Box<[Pubkey; 20]>,
}

const MAX_TRANSMITTERS: usize = 20;

const MAX_EXECUTORS: usize = 20;

const MAX_PROPOSERS: usize = 20;

impl ProtocolInfo {
    pub const LEN: usize =
        8 + 1 + 8 + 32 + (20 * MAX_TRANSMITTERS) + (32 * MAX_EXECUTORS) + (32 * MAX_PROPOSERS);
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer, mut)]
    admin: Signer<'info>,

    #[account(init_if_needed, space = ProtocolInfo::LEN, payer = admin, seeds = [ROOT, b"PROTOCOL", UDF_PROTOCOL_ID], bump)]
    protocol_info: Box<Account<'info, ProtocolInfo>>,
    system_program: Program<'info, System>,
}
