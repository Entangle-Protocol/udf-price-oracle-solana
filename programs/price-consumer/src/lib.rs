use anchor_lang::prelude::*;
use solana_program::pubkey;

declare_id!("3r5ixGQu8DRmJWgFEjwnDUQ6yasfYFXDsUbqkA6gkRtv");

const UDF_ID: Pubkey = pubkey!("7HramSnctpbXqZ4SEzqvqteZdMdj3tEB2c9NT7egPQi7");

#[program]
pub mod price_consumer {
    use super::*;

    pub fn consume_price(ctx: Context<ConsumePrice>, asset: String) -> Result<()> {
        let data = &ctx.accounts.latest_update.data.borrow()[8 + 32..];
        let (price, timestamp) = <([u8; 32], u64)>::try_from_slice(data)
            .expect("Expected price and timeout to be deserialized with borsh");
        let (_, price_right) = price.split_at(16);
        let price = u128::try_from_slice(price_right).unwrap().to_be();
        msg!("Price of: {} is: {} at: {}", asset, price, timestamp);
        Ok(())
    }
}

pub const ROOT: &[u8] = b"UDF0";

#[cfg(not(feature = "mainnet"))]
const UDF_PROTOCOL_ID: &[u8] = b"universal-data-feeds3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";
#[cfg(feature = "mainnet")]
const UDF_PROTOCOL_ID: &[u8] = b"universal-data-feeds\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";

#[derive(Accounts)]
#[instruction(asset: String)]
pub struct ConsumePrice<'info> {
    #[account(signer, mut)]
    payer: Signer<'info>,
    /// CHECK: This account is derived using specific seeds, including the asset. Ensure the seeds match the provided asset to trust the account.
    #[account(
        seeds = [ROOT, b"LAST_UPDATE", UDF_PROTOCOL_ID, asset.as_bytes()],
        bump,
        seeds::program = UDF_ID,
    )]
    latest_update: UncheckedAccount<'info>,
}
