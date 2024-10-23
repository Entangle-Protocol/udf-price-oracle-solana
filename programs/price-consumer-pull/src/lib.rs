use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke},
};

declare_id!("GHzaqPXQUSQ4AD9c7w7dgA3LR4ztZYTDGKqs5E2JZTwJ");

#[program]
pub mod price_consumer_pull {
    use super::*;

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

        // consuming logic follows here

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
