use anchor_lang::prelude::*;

declare_id!("3r5ixGQu8DRmJWgFEjwnDUQ6yasfYFXDsUbqkA6gkRtv");

#[program]
pub mod price_consumer {
    use super::*;
    use anchor_lang::solana_program::{
        instruction::Instruction,
        program::{get_return_data, invoke},
    };

    pub fn consume_price(ctx: Context<ConsumePrice>, asset: String) -> Result<()> {
        let payload =
            asset.try_to_vec().expect("Asset is expected be converted to the vec of bytes");
        let data = [&sighash("global", "last_price")[..], &payload[..]].concat();
        let ix = Instruction {
            program_id: ctx.accounts.price_oracle.key(),
            accounts: ctx.accounts.latest_update.to_account_metas(Some(false)),
            data,
        };
        invoke(&ix, &[ctx.accounts.latest_update.to_account_info()])?;
        let (_, data) = get_return_data().expect("Data expected to be gotten from price oracle");
        let (price, timestamp) = <([u8; 32], u64)>::try_from_slice(&data)
            .expect("Expected price and timeout to be deserialized with borsh");
        let (_, price_right) = price.split_at(16);
        let price = u128::try_from_slice(price_right).unwrap().to_be();
        emit!(ConsumePriceEvent {
            asset: asset.split_once('\0').map_or(asset.clone(), |res| res.0.into()),
            price,
            timestamp,
        });
        Ok(())
    }
}

fn sighash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()[..8],
    );
    sighash
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
    /// CHECK: This is an external price oracle, and no specific owner is expected. The account is marked as executable to ensure it's a program.
    #[account(executable)]
    price_oracle: UncheckedAccount<'info>,
    /// CHECK: This account is derived using specific seeds, including the asset. Ensure the seeds match the provided asset to trust the account.
    #[account(seeds = [ROOT, b"LAST_UPDATE", UDF_PROTOCOL_ID, asset.as_bytes()], bump, seeds::program = price_oracle)]
    latest_update: UncheckedAccount<'info>,
}

#[event]
struct ConsumePriceEvent {
    asset: String,
    price: u128,
    timestamp: u64,
}
