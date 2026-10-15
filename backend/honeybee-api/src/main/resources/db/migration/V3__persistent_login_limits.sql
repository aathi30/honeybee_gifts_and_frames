CREATE TABLE login_attempt_windows (
 ip_hash VARCHAR(64) PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
 expires_at BIGINT NOT NULL
);
CREATE INDEX idx_login_attempt_expiry ON login_attempt_windows(expires_at);
