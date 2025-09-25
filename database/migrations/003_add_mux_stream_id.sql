-- Add mux_stream_id column to streams table
-- This stores the actual Mux Live Stream ID returned from Mux API

ALTER TABLE streams 
ADD COLUMN mux_stream_id VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN streams.mux_stream_id IS 'Actual Mux Live Stream ID from Mux API (e.g., fTfyyhrcsd2Ec2JgmRR4o015uczmDdowT69TVHX7WhiA)';
