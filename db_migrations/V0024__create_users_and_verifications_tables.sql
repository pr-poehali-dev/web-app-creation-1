-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    phone VARCHAR(50),
    user_type VARCHAR(50),
    company_name VARCHAR(255),
    inn VARCHAR(50),
    ogrnip VARCHAR(50),
    verification_status VARCHAR(50) DEFAULT 'not_verified',
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_verifications table
CREATE TABLE IF NOT EXISTS user_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    registration_address TEXT,
    actual_address TEXT,
    passport_scan_url TEXT,
    passport_registration_url TEXT,
    utility_bill_url TEXT,
    registration_cert_url TEXT,
    agreement_form_url TEXT,
    company_name VARCHAR(255),
    inn VARCHAR(50),
    ogrnip VARCHAR(50),
    rejection_reason TEXT,
    admin_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
