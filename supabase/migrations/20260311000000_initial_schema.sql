-- Create Enums
CREATE TYPE session_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE settlement_status AS ENUM ('pending', 'completed');

-- Create set_updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table: sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    base_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    status session_status DEFAULT 'active',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick room code lookups
CREATE INDEX idx_sessions_room_code ON sessions(room_code);

-- Table: participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    avatar_icon VARCHAR(50),
    avatar_color VARCHAR(7),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_participants_session_id ON participants(session_id);

-- Table: receipts
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate_to_base DECIMAL(10,4) DEFAULT 1.0,
    parsed_data JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status processing_status DEFAULT 'pending',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_receipts_session_id ON receipts(session_id);
CREATE TRIGGER set_timestamp_receipts
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Table: items
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    original_item_name VARCHAR(255),
    item_image_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    assigned_to UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_receipt_id ON items(receipt_id);
CREATE TRIGGER set_timestamp_items
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Table: settlements
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    from_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    to_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status settlement_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settlements_session_id ON settlements(session_id);
CREATE TRIGGER set_timestamp_settlements
    BEFORE UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Set up Row Level Security (RLS)
-- For MVP, we'll allow anon reads/writes broadly, but in a real prod app 
-- you would restrict this to authenticated users or validate room_code.
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the MVP (since we specified no-auth in PRD)
CREATE POLICY "Allow anonymous all access to sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow anonymous all access to participants" ON participants FOR ALL USING (true);
CREATE POLICY "Allow anonymous all access to receipts" ON receipts FOR ALL USING (true);
CREATE POLICY "Allow anonymous all access to items" ON items FOR ALL USING (true);
CREATE POLICY "Allow anonymous all access to settlements" ON settlements FOR ALL USING (true);
