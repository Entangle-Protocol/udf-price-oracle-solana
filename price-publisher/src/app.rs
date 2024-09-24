use log::info;
use tokio::sync::mpsc::UnboundedReceiver;
use udf_solana::data::MultipleUpdateMessage;

use crate::{config::PublisherConfig, data::LatestUpdate, data_feed_processor::DataFeedProcessor};

pub(crate) struct PublisherApp {
    data_feed_proc: DataFeedProcessor,
}

impl PublisherApp {
    pub(crate) async fn try_new(
        publisher_config: PublisherConfig,
        data_feed_msg_receiver: UnboundedReceiver<MultipleUpdateMessage>,
    ) -> Result<PublisherApp, ()> {
        info!("Module started {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"));
        Ok(PublisherApp {
            data_feed_proc: DataFeedProcessor::try_new(data_feed_msg_receiver, publisher_config)
                .await?,
        })
    }

    pub(crate) async fn execute(&self) {
        self.data_feed_proc.execute().await;
    }

    pub(crate) async fn get_latest_update(&self, data_key: [u8; 32]) -> LatestUpdate {
        self.data_feed_proc.get_latest_update(data_key).await.unwrap_or_default()
    }

    pub(crate) fn get_chain_id(&self) -> u128 {
        self.data_feed_proc.get_chain_id()
    }
}
