CREATE TABLE IF NOT EXISTS xp_log_events (
 cursor_id BIGSERIAL PRIMARY KEY,
 event_id VARCHAR(100) NOT NULL UNIQUE,
 received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 match_id VARCHAR(200) NOT NULL DEFAULT '',
 player_name VARCHAR(200) NOT NULL DEFAULT '',
 event_type VARCHAR(80) NOT NULL,
 session_id VARCHAR(100) NOT NULL,
 event_seq INTEGER NOT NULL,
 payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS xp_logs_match_cursor ON xp_log_events(match_id,cursor_id);
CREATE INDEX IF NOT EXISTS xp_logs_player_cursor ON xp_log_events(player_name,cursor_id);
CREATE INDEX IF NOT EXISTS xp_logs_type_cursor ON xp_log_events(event_type,cursor_id);
CREATE INDEX IF NOT EXISTS xp_logs_received ON xp_log_events(received_at);
CREATE TABLE IF NOT EXISTS xp_log_rate (
 bucket CHAR(64) NOT NULL,
 window_start TIMESTAMPTZ NOT NULL,
 hits INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(bucket,window_start)
);
