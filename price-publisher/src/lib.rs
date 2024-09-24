mod app;
mod config;
mod data;
mod data_feed_processor;
mod error;

extern crate udf_solana;

use log::{debug, error, warn};
use once_cell::sync::Lazy;
use std::{slice, sync::Arc, time::Duration};
use tokio::{
    runtime::{self, Runtime},
    select,
    sync::mpsc::{unbounded_channel, UnboundedSender},
};
use udf_solana::data::MultipleUpdateMessage;

use crate::{
    app::PublisherApp,
    config::PublisherConfig,
    data::{LatestUpdate, MerkleRootUpdateMultiple},
};

struct PricePublisherRuntime {
    _tokio_runtime: Runtime,
    data_feed_msg_sender: UnboundedSender<MultipleUpdateMessage>,
    publisher_app: Arc<PublisherApp>,
}

static RUNTIME: Lazy<PricePublisherRuntime> = Lazy::new(|| {
    env_logger::init();
    println!("Tokio runtime is being started");
    let tokio_runtime = runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Expected tokio runtime to be started");
    let (data_feed_msg_sender, data_feed_msg_receiver) = unbounded_channel();

    let config_path =
        std::env::var("ENT_SOLANA_PUBLISHER_CONFIG").unwrap_or_else(|_| "config.yml".to_string());
    let publisher_config = PublisherConfig::try_from_path(&config_path)
        .map_err(|err| error!("Failed to read config from path: {}, error: {}", config_path, err))
        .expect("Expected publisher config to be read");

    let publisher_app = tokio_runtime.block_on(async move {
        PublisherApp::try_new(publisher_config, data_feed_msg_receiver)
            .await
            .expect("feed_manager expected to be created well")
    });
    let arc_app = Arc::new(publisher_app);
    let publisher_app = arc_app.clone();
    tokio_runtime.spawn(async move {
        publisher_app.execute().await;
    });

    PricePublisherRuntime {
        _tokio_runtime: tokio_runtime,
        data_feed_msg_sender,
        publisher_app: arc_app,
    }
});

/// # Safety
#[allow(private_interfaces)]
#[no_mangle]
pub unsafe extern "C" fn update_multiple_assets(data: *const MerkleRootUpdateMultiple) {
    if data.is_null() {
        error!("Error: Null pointer received");
        return;
    }

    let merkle_root_update_multiple: &MerkleRootUpdateMultiple = unsafe { &*data };
    let sender = &RUNTIME.data_feed_msg_sender;
    let data_feed_message = MultipleUpdateMessage::from(merkle_root_update_multiple);
    if let Err(err) = sender.send(data_feed_message) {
        error!("Failed to send data_feed_message through the channel: {}", err);
    };
}

/// # Safety
#[allow(private_interfaces)]
#[no_mangle]
pub unsafe extern "C" fn get_latest_update(data_key: *const u8) -> LatestUpdate {
    let data_key: &[u8] = unsafe { slice::from_raw_parts(data_key, 32) };
    let data_key: &[u8; 32] = data_key.try_into().expect("data_key should be 32 bytes long");
    debug!("Latest update requested: {}", String::from_utf8_lossy(data_key));
    let publisher_app = &RUNTIME.publisher_app;
    RUNTIME._tokio_runtime.block_on(async move {
        select! {
            latest_update = publisher_app.get_latest_update(*data_key) => latest_update,
            _ = tokio::time::sleep(Duration::from_secs(2)) => {
                warn!("Failed to get latest update in 2 seconds");
                LatestUpdate::default()
            }
        }
    })
}

/// # Safety
#[allow(private_interfaces)]
#[no_mangle]
pub unsafe extern "C" fn get_chain_id(return_chain_id: *mut u8) {
    let publisher_app = &RUNTIME.publisher_app;
    let to_return = publisher_app.get_chain_id();
    let bytes: &mut u128 = &mut *(return_chain_id as *mut u128);
    *bytes = to_return.to_be();
}
