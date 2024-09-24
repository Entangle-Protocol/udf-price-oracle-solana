use thiserror::Error;

#[derive(Debug, Error)]
pub enum PublisherError {
    #[error("Config error")]
    Config,
}
