-- Create table for storing verification documents
CREATE TABLE verification_documents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(500),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user_id
CREATE INDEX idx_verification_documents_user_id ON verification_documents(user_id);

-- Create index for faster queries by status
CREATE INDEX idx_verification_documents_status ON verification_documents(status);
