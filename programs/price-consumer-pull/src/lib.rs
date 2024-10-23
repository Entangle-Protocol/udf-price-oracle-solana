use anchor_lang::prelude::*;

declare_id!("GHzaqPXQUSQ4AD9c7w7dgA3LR4ztZYTDGKqs5E2JZTwJ");

#[program]
pub mod price_consumer_pull {
    use super::*;
    use anchor_lang::solana_program::{
        instruction::Instruction,
        program::{get_return_data, invoke},
    };

    pub fn verify_price<'info>(
        ctx: Context<'_, '_, '_, 'info, VerifyPrice<'info>>,
        last_price_message: LastPriceMessage,
    ) -> Result<()> {
        let mut payload = vec![];
        last_price_message.serialize(&mut payload)?;
        let data = [&sighash("global", "get_last_price")[..], &payload[..]].concat();
        let accounts = vec![
            ctx.accounts.publisher.to_account_info(),
            ctx.accounts.config.to_account_info(),
            ctx.accounts.protocol_info.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.latest_update.to_account_info(),
        ];

        let metas: Vec<_> = accounts
            .iter()
            .map(|x| x.to_account_metas(None).first().expect("always at least one").clone())
            .collect();

        let ix = Instruction {
            program_id: ctx.accounts.price_oracle.key(),
            accounts: metas,
            data,
        };
        invoke(&ix, &accounts)?;
        Ok(())
    }

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
        msg!("Price of: {} is: {} at: {}", asset, price, timestamp);
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

#[derive(Accounts)]
#[instruction(last_price_message: LastPriceMessage)]
pub struct VerifyPrice<'info> {
    #[account(signer, mut)]
    publisher: Signer<'info>,
    /// CHECK: This is an external price oracle, and no specific owner is expected. The account is marked as executable to ensure it's a program.
    price_oracle: UncheckedAccount<'info>,
    /// CHECK: This is a configuration account that is specifically determined by the price_oracle program
    config: UncheckedAccount<'info>,
    /// CHECK: This is a protocol info account that is specifically determined by the price_oracle program, it refers to the list of authorized transmitters
    protocol_info: UncheckedAccount<'info>,
    /// CHECK: This account is derived using specific seeds, including the asset. Ensure the seeds match the provided asset to trust the account.
    #[account(mut)]
    latest_update: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct LastPriceMessage {
    pub merkle_root: [u8; 32],
    pub data_feed: DataFeed,
    pub signatures: Vec<TransmitterSignature>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Debug)]
pub struct TransmitterSignature {
    pub v: u8,
    pub r: Vec<u8>,
    pub s: Vec<u8>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Debug, Default)]
pub struct DataFeed {
    pub timestamp: u64,
    pub data_key: [u8; 32],
    pub data: [u8; 32],
    pub merkle_proof: Vec<[u8; 32]>,
}

#[derive(Accounts)]
#[instruction(asset: String)]
pub struct ConsumePrice<'info> {
    #[account(signer, mut)]
    payer: Signer<'info>,
    /// CHECK: This is an external price oracle, and no specific owner is expected. The account is marked as executable to ensure it's a program.
    #[account(executable)]
    price_oracle: UncheckedAccount<'info>,
    /// CHECK: This account is derived using specific seeds, including the asset. Ensure the seeds match the provided asset to trust the account.
    latest_update: UncheckedAccount<'info>,
}
