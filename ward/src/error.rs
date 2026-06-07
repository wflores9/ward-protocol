use thiserror::Error;

#[derive(Debug, Error)]
pub enum WardError {
    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Ledger error: {0}")]
    LedgerError(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Address error: invalid XRPL classic address: {0}")]
    AddressError(String),

    #[error("Condition error: {0}")]
    ConditionError(String),
}
