use anchor_client::{Client, Cluster};
use anchor_lang::{
    prelude::{AccountMeta, Pubkey},
    InstructionData, ToAccountMetas,
};
use log::{debug, error};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signer},
};
use solana_tools::solana_transactor::{ix_compiler::InstructionBundle, RpcPool, SolanaTransactor};
use tokio::sync::{mpsc::UnboundedReceiver, Mutex};
use udf_solana::{
    data::{
        Config as UdfConfig, DataFeed, LatestUpdate as LatestUpdateAccount, MultipleUpdateMessage,
    },
    udf_solana::ROOT,
};

use crate::{config::PublisherConfig, data::LatestUpdate};

const PHOTON_ROOT: &[u8] = b"r0";
const PHOTON_PROGRAM: Pubkey = Pubkey::new_from_array([
    12, 50, 145, 223, 16, 33, 233, 37, 119, 186, 206, 30, 187, 117, 189, 70, 23, 0, 141, 139, 21,
    92, 169, 187, 124, 139, 89, 86, 127, 197, 95, 163,
]);
const DATA_FEED_CHUNK_SIZE: usize = 3;

pub(crate) struct DataFeedProcessor {
    data_feed_msg_receiver: Mutex<UnboundedReceiver<MultipleUpdateMessage>>,
    transactor: SolanaTransactor,
    publisher_config: PublisherConfig,
}

impl DataFeedProcessor {
    pub(crate) async fn try_new(
        data_feed_msg_receiver: UnboundedReceiver<MultipleUpdateMessage>,
        publisher_config: PublisherConfig,
    ) -> Result<DataFeedProcessor, ()> {
        let rpc_pool =
            RpcPool::new(&publisher_config.solana.read_rpcs, &publisher_config.solana.write_rpcs)
                .map_err(|err| error!("Failed to create rpc_pool: {}", err))?;
        let transactor = SolanaTransactor::start(rpc_pool)
            .await
            .map_err(|err| error!("Failed to start solana transactor: {}", err))?;
        Ok(DataFeedProcessor {
            data_feed_msg_receiver: Mutex::new(data_feed_msg_receiver),
            transactor,
            publisher_config,
        })
    }

    pub(crate) async fn execute(&self) {
        while let Some(data_feed_msg) = self.data_feed_msg_receiver.lock().await.recv().await {
            let _ = self.process_data_feed_msg(data_feed_msg).await;
        }
    }

    async fn process_data_feed_msg(&self, data_feed_msg: MultipleUpdateMessage) -> Result<(), ()> {
        debug!("data_feed_msg: {}", data_feed_msg);
        let read_rpc = self
            .publisher_config
            .solana
            .read_rpcs
            .first()
            .ok_or_else(|| error!("Failed to get first read rpc"))?;
        let publisher = &self.publisher_config.publisher;
        let client =
            Client::new(Cluster::Custom(read_rpc.url.to_string(), String::default()), publisher);
        let program = client
            .program(udf_solana::ID)
            .map_err(|err| error!("Failed to get udf_solana program client: {}", err))?;
        let (config, _) = Pubkey::find_program_address(&[ROOT, b"CONFIG"], &udf_solana::ID);
        let config_acc: UdfConfig = program.account(config).await.map_err(|err| {
            error!(
                "Failed to get price oracle sc config account data at: {}, error: {}",
                config, err
            )
        })?;

        let (protocol_info, _) = Pubkey::find_program_address(
            &[PHOTON_ROOT, b"PROTOCOL", &config_acc.protocol_id],
            &PHOTON_PROGRAM,
        );
        let base_accounts: Vec<AccountMeta> = udf_solana::accounts::UpdateAssets {
            publisher: publisher.pubkey(),
            config,
            protocol_info,
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None);

        for data_feeds in data_feed_msg.data_feeds.chunks(DATA_FEED_CHUNK_SIZE) {
            let mut msg = data_feed_msg.clone();
            msg.data_feeds = data_feeds.to_vec();

            let mut accounts = base_accounts.clone();
            Self::extend_accounts_by_feeds(&msg.data_feeds, &config_acc.protocol_id, &mut accounts);
            let update_mult_assets_data = udf_solana::instruction::UpdateMultipleAssets {
                multiple_update_message: msg,
            }
            .data();
            let ix =
                Instruction::new_with_bytes(udf_solana::id(), &update_mult_assets_data, accounts);
            let bundle = vec![InstructionBundle::new(ix, 400000)];
            const COMPUTE_UNIT_PRICE_LAMPORTS: u64 = 1000;
            self.transactor
                .send_all_instructions::<&str>(
                    None,
                    &bundle,
                    &[publisher],
                    publisher.pubkey(),
                    1,
                    &[],
                    Some(COMPUTE_UNIT_PRICE_LAMPORTS),
                    false,
                )
                .await
                .map_err(|err| error!("Failed to process transaction: {}", err))?;
        }
        Ok(())
    }

    fn get_client(&self) -> Result<Client<&Keypair>, ()> {
        let read_rpc = self
            .publisher_config
            .solana
            .read_rpcs
            .first()
            .ok_or_else(|| error!("Failed to get first read rpc"))?;
        Ok(Client::new(
            Cluster::Custom(read_rpc.url.to_string(), String::default()),
            &self.publisher_config.publisher,
        ))
    }

    fn extend_accounts_by_feeds(
        data_feeds: &[DataFeed],
        protocol_id: &[u8],
        accounts: &mut Vec<AccountMeta>,
    ) {
        let remaining_accounts = data_feeds
            .iter()
            .map(|data_feed| Self::get_data_key_pda(&data_feed.data_key, protocol_id));

        let pda = data_feeds
            .iter()
            .map(|data_feed| {
                let pda = Self::get_data_key_pda(&data_feed.data_key, protocol_id);
                format!("{}: {}", String::from_utf8_lossy(&data_feed.data_key), pda.pubkey)
            })
            .collect::<Vec<String>>()
            .join(", ");
        debug!("pda: [{}]", pda);
        accounts.extend(remaining_accounts);
    }

    fn get_data_key_pda(data_key: &[u8], udf_protocol_id: &[u8]) -> AccountMeta {
        let (asset_pda, _) = Pubkey::find_program_address(
            &[ROOT, b"LAST_UPDATE", udf_protocol_id, data_key],
            &udf_solana::ID,
        );
        AccountMeta::new(asset_pda, false)
    }

    pub(crate) async fn get_latest_update(&self, data_key: [u8; 32]) -> Result<LatestUpdate, ()> {
        let client = self.get_client()?;

        let program = client
            .program(udf_solana::ID)
            .map_err(|err| error!("Failed to get udf_solana program client: {}", err))?;

        let (config, _) = Pubkey::find_program_address(
            &[udf_solana::udf_solana::ROOT, b"CONFIG"],
            &udf_solana::ID,
        );

        let config_acc: UdfConfig = program.account(config).await.map_err(|err| {
            error!(
                "Failed to get price oracle sc config account data at: {}, error: {}",
                config, err
            )
        })?;

        let (asset_pda, _) = Pubkey::find_program_address(
            &[
                udf_solana::udf_solana::ROOT,
                b"LAST_UPDATE",
                &config_acc.protocol_id,
                &data_key,
            ],
            &udf_solana::ID,
        );
        debug!(
            "Latest update requested for: {}, pda: {}",
            String::from_utf8_lossy(&data_key),
            asset_pda
        );
        let last_update =
            program.account::<LatestUpdateAccount>(asset_pda).await.map_err(|err| {
                error!("Failed to get latest update account at: {}, error: {}", asset_pda, err)
            })?;

        Ok(LatestUpdate {
            price: last_update.data,
            timestamp: last_update.data_timestamp,
        })
    }

    pub(crate) fn get_chain_id(&self) -> u128 {
        self.publisher_config.solana.chain_id
    }
}
