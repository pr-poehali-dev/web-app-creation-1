-- Add media fields to contracts table for product photos and videos
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS product_images TEXT[], 
ADD COLUMN IF NOT EXISTS product_video_url VARCHAR(500);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_product_images ON contracts USING GIN (product_images);

-- Add comment for documentation
COMMENT ON COLUMN contracts.product_images IS 'Array of product image URLs';
COMMENT ON COLUMN contracts.product_video_url IS 'Optional product video URL';
