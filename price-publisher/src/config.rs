use config::{Config, File};
use log::{error, info};
use serde::Deserialize;
use solana_sdk::signature::Keypair;
use solana_tools::{solana_logs::SolanaClientConfig, utils::deserialize_keypair};

use crate::error::PublisherError;

#[derive(Debug, Deserialize)]
pub(crate) struct PublisherConfig {
    pub(crate) solana: SolanaClientConfig,
    #[serde(deserialize_with = "deserialize_keypair")]
    pub(crate) publisher: Keypair,
}

impl PublisherConfig {
    pub(super) fn try_from_path(config: &str) -> Result<PublisherConfig, PublisherError> {
        info!("Read config from path: {}", config);
        let config = Config::builder()
            .add_source(File::with_name(config))
            .add_source(config::Environment::with_prefix("ENTANGLE").separator("_"))
            .build()
            .map_err(|err| {
                error!("Failed to build envs due to the error: {}", err);
                PublisherError::Config
            })?;

        config.try_deserialize().map_err(|err| {
            error!("Failed to deserialize config: {}", err);
            PublisherError::Config
        })
    }
}
