-- Hospital Bed Capacity Predictor - Supabase Schema

-- 1. Profiles (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'patient')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bed Status (Current snapshots)
CREATE TABLE bed_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    total_beds INTEGER NOT NULL CHECK (total_beds >= 0),
    occupied_beds INTEGER NOT NULL CHECK (occupied_beds >= 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Admissions
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    admitted_at TIMESTAMPTZ NOT NULL,
    discharged_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('admitted', 'discharged', 'transferred')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Agents
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    -- Expanded types to include 'orchestrator' for unified agents
    agent_type TEXT NOT NULL CHECK (agent_type IN ('data_acquisition', 'prediction', 'decision', 'communication', 'learning', 'orchestrator')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    predicted_for TIMESTAMPTZ NOT NULL,
    predicted_occupied_beds INTEGER NOT NULL,
    model_version TEXT,
    created_by_agent UUID REFERENCES agents(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Prediction Outcomes (for Learning Agent)
CREATE TABLE prediction_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
    actual_occupied_beds INTEGER NOT NULL,
    error INTEGER GENERATED ALWAYS AS (actual_occupied_beds - predicted_occupied_beds) STORED,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('normal', 'warning', 'critical')),
    message TEXT NOT NULL,
    triggered_by_prediction UUID REFERENCES predictions(id) ON DELETE SET NULL,
    created_by_agent UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE
);

-- 10. Agent Logs
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some initial data
INSERT INTO departments (name) VALUES ('Emergency Care'), ('General Ward'), ('ICU'), ('Pediatrics');

-- Seed Agents
INSERT INTO agents (name, agent_type) VALUES 
('Neuro-Sync', 'data_acquisition'),
('Prophet-7', 'prediction'),
('Sentinel-X', 'decision'),
('Nexus-Comms', 'communication'),
('Omni-Learn', 'learning');
