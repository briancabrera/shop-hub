-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_discount_percentage CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR 
    discount_type = 'fixed'
  )
);

-- Create deal_products junction table
CREATE TABLE IF NOT EXISTS deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, product_id)
);

-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_price DECIMAL(10,2) NOT NULL CHECK (bundle_price > 0),
  original_price DECIMAL(10,2) NOT NULL CHECK (original_price > 0),
  savings_amount DECIMAL(10,2) GENERATED ALWAYS AS (original_price - bundle_price) STORED,
  savings_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND(((original_price - bundle_price) / original_price * 100)::numeric, 2)
  ) STORED,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  max_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_bundle_pricing CHECK (bundle_price < original_price)
);

-- Create bundle_products junction table
CREATE TABLE IF NOT EXISTS bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_active_dates ON deals(active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_deal_products_deal_id ON deal_products(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_product_id ON deal_products(product_id);
CREATE INDEX IF NOT EXISTS idx_bundles_active_featured ON bundles(active, featured);
CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle_id ON bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_product_id ON bundle_products(product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_deals_updated_at 
  BEFORE UPDATE ON deals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at 
  BEFORE UPDATE ON bundles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a deal is currently active
CREATE OR REPLACE FUNCTION is_deal_active(deal_row deals)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN deal_row.active = true 
    AND NOW() >= deal_row.start_date 
    AND NOW() <= deal_row.end_date
    AND (deal_row.max_uses IS NULL OR deal_row.current_uses < deal_row.max_uses);
END;
$$ LANGUAGE plpgsql;

-- Function to get active deals for a product
CREATE OR REPLACE FUNCTION get_product_active_deals(p_product_id UUID)
RETURNS TABLE(
  deal_id UUID,
  deal_name VARCHAR(255),
  discount_type VARCHAR(20),
  discount_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.discount_type,
    d.discount_value
  FROM deals d
  JOIN deal_products dp ON d.id = dp.deal_id
  WHERE dp.product_id = p_product_id
    AND is_deal_active(d);
END;
$$ LANGUAGE plpgsql;
