pub mod data;
mod error;
mod hash;
mod utils;

use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, system_instruction},
};
use ethabi::Token;
use std::mem::size_of;

use data::{
    Config, DataFeed, LastPriceMessage, LatestUpdate, MultipleUpdateMessage, ProtocolInfo,
    TransmitterSignature,
};

use crate::{error::CustomError, hash::keccak256};

declare_id!("7HramSnctpbXqZ4SEzqvqteZdMdj3tEB2c9NT7egPQi7");

pub type EthAddress = [u8; 20];

pub mod hashes {}

#[program]
pub mod udf_solana {
    use super::*;

    pub const ROOT: &[u8] = b"UDF0";
    pub const PHOTON_ROOT: &[u8] = b"r0";

    #[cfg(feature = "mainnet")]
    pub const DEPLOYER: &str = "BMBeWpWc16LQNtqw4JxjSWTf5E9mUBhhPzuTmaVFvxrf";
    #[cfg(not(feature = "mainnet"))]
    pub const DEPLOYER: &str = "2NNm83t5mF28YZYo3SGyitVHQGSLoppJ4RQnRhvRB8ZY";

    pub const MAX_TRANSMITTERS: usize = 20;
    pub const MAX_EXECUTORS: usize = 20;
    pub const MAX_PROPOSERS: usize = 20;
    pub const RATE_DECIMALS: u64 = 10000;

    pub fn initialize(ctx: Context<Initialize>, protocol_id: [u8; 32]) -> Result<()> {
        ctx.accounts.config.admin = ctx.accounts.admin.key();
        ctx.accounts.config.protocol_id = protocol_id;
        ctx.accounts.config.endpoint = *ctx.accounts.endpoint.key;
        Ok(())
    }

    pub fn get_last_price<'info>(
        ctx: Context<'_, '_, '_, 'info, UpdateAssets<'info>>,
        last_price_message: LastPriceMessage,
    ) -> Result<[u8; 32]> {
        if !is_consensus_reached(
            last_price_message.merkle_root,
            last_price_message.signatures,
            &ctx.accounts.protocol_info,
        )? {
            return Err(Error::from(CustomError::ConsensusNotReached));
        }
        update_asset(&ctx, last_price_message.data_feed, last_price_message.merkle_root)
    }

    pub fn update_multiple_assets<'info>(
        ctx: Context<'_, '_, '_, 'info, UpdateAssets<'info>>,
        multiple_update_message: MultipleUpdateMessage,
    ) -> Result<()> {
        if !is_consensus_reached(
            multiple_update_message.merkle_root,
            multiple_update_message.signatures,
            &ctx.accounts.protocol_info,
        )? {
            return Err(Error::from(CustomError::ConsensusNotReached));
        }

        for data_feed in multiple_update_message.data_feeds {
            update_asset(&ctx, data_feed, multiple_update_message.merkle_root)?;
        }

        Ok(())
    }
}

pub fn update_asset<'info>(
    ctx: &Context<'_, '_, '_, 'info, UpdateAssets<'info>>,
    data_feed: DataFeed,
    merkle_root: [u8; 32],
) -> Result<[u8; 32]> {
    require!(data_feed.data.len() == 32, CustomError::InconsistentData);

    if !verify_data_feed(&data_feed, merkle_root) {
        return Err(Error::from(CustomError::MerkleProofNotVerified));
    };
    let (latest_update_pda, latest_update_bump) = Pubkey::find_program_address(
        &[
            ROOT,
            b"LAST_UPDATE",
            &ctx.accounts.config.protocol_id,
            &data_feed.data_key,
        ],
        &ID,
    );
    let latest_update_info = ctx
        .remaining_accounts
        .iter()
        .find(|account_info| account_info.key == &latest_update_pda)
        .expect("Expected to be present")
        .clone();

    if **latest_update_info.lamports.borrow() == 0 {
        alloc_latest_update_account(
            ctx,
            data_feed.data_key,
            latest_update_bump,
            latest_update_info.clone(),
        )?;
        LatestUpdate::default()
            .try_serialize(&mut &mut latest_update_info.try_borrow_mut_data()?[..])?;
    };

    let mut latest_update =
        LatestUpdate::try_deserialize(&mut &latest_update_info.try_borrow_data()?[..])?;

    // If the timestamp of new update is older than the latest timestamp,
    // parse and ignore this update
    if data_feed.timestamp <= latest_update.data_timestamp {
        let data_key = String::from_utf8_lossy(&data_feed.data_key);
        msg!("New update is older for the given key and is ignored: {}", data_key);
        return Ok(data_feed.data);
    }
    latest_update.data.copy_from_slice(&data_feed.data[..32]);
    latest_update.data_timestamp = data_feed.timestamp;
    latest_update.data_key = data_feed.data_key;

    latest_update.try_serialize(&mut &mut latest_update_info.try_borrow_mut_data()?[..])?;
    Ok(data_feed.data)
}

fn verify_data_feed(data_feed: &DataFeed, merkle_root: [u8; 32]) -> bool {
    let leaf = ethabi::encode(&[
        Token::Uint(ethabi::Uint::from(data_feed.timestamp)),
        Token::Bytes(data_feed.data.to_vec()),
        Token::FixedBytes(data_feed.data_key.to_vec()),
    ]);
    let leaf = keccak256(keccak256(leaf));
    hash::verify(data_feed.merkle_proof.clone(), merkle_root, leaf)
}

fn alloc_latest_update_account<'info>(
    ctx: &Context<'_, '_, '_, 'info, UpdateAssets<'info>>,
    data_key: [u8; 32],
    latest_update_bump: u8,
    latest_update_info: AccountInfo<'info>,
) -> Result<()> {
    let space = size_of::<LatestUpdate>() + 8;
    let lamports = Rent::get()?.minimum_balance(space);
    let publisher_info = ctx.accounts.publisher.to_account_info();
    let system_program_info = ctx.accounts.system_program.to_account_info();

    invoke_signed(
        &system_instruction::create_account(
            &ctx.accounts.publisher.key(),
            &latest_update_info.key(),
            lamports,
            space as u64,
            &ID,
        ),
        &[
            publisher_info,
            latest_update_info.clone(),
            system_program_info,
        ],
        &[&[
            ROOT,
            b"LAST_UPDATE",
            &ctx.accounts.config.protocol_id,
            &data_key,
            &[latest_update_bump],
        ]],
    )?;
    Ok(())
}

fn is_consensus_reached(
    merkle_root: [u8; 32],
    signatures: Vec<TransmitterSignature>,
    protocol_info: &ProtocolInfo,
) -> Result<bool> {
    let mut merkle_root_bytes = b"\x19Ethereum Signed Message:\n32".to_vec();
    merkle_root_bytes.extend(merkle_root.to_vec());
    let hash_to_recover_sig: [u8; 32] = keccak256(merkle_root_bytes);
    let allowed_transmitters = protocol_info.transmitters();

    let mut unique_signers = vec![];
    let mut consensus_reached = false;
    for signature in &signatures {
        let transmitter = utils::ecrecover(&hash_to_recover_sig, signature)?;
        if !allowed_transmitters.contains(&transmitter) || unique_signers.contains(&transmitter) {
            continue;
        }
        unique_signers.push(transmitter);
        let consensus_rate =
            ((unique_signers.len() as u64) * RATE_DECIMALS) / (allowed_transmitters.len() as u64);
        if consensus_rate >= protocol_info.consensus_target_rate {
            consensus_reached = true;
            break;
        }
    }
    Ok(consensus_reached)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer, mut, constraint = (admin.key() == config.admin || admin.key() == DEPLOYER.parse().expect("Deployer key not set"))@ CustomError::IsNotAdmin)]
    admin: Signer<'info>,
    #[account(init_if_needed, payer = admin, space = Config::LEN, seeds = [ROOT, b"CONFIG"], bump)]
    config: Box<Account<'info, Config>>,
    /// CHECK:
    #[account(executable)]
    endpoint: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAssets<'info> {
    #[account(signer, mut)]
    publisher: Signer<'info>,
    #[account(seeds = [ROOT, b"CONFIG"], bump)]
    config: Box<Account<'info, Config>>,
    #[account(seeds = [PHOTON_ROOT, b"PROTOCOL", &config.protocol_id], bump, seeds::program = config.endpoint)]
    protocol_info: Box<Account<'info, ProtocolInfo>>,
    system_program: Program<'info, System>,
}
