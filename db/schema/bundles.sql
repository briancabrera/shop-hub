-- Tabla de Bundles
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  discount_percentage DECIMAL(5, 2) NOT NULL,
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  slug VARCHAR(255) UNIQUE NOT NULL
);

-- Tabla de relación entre bundles y productos
CREATE TABLE IF NOT EXISTS bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(bundle_id, product_id)
);

-- Función para recalcular el precio del bundle automáticamente
CREATE OR REPLACE FUNCTION calculate_bundle_price()
RETURNS TRIGGER AS $$
DECLARE
  original_total DECIMAL(10, 2);
  final_price DECIMAL(10, 2);
BEGIN
  -- Calcular el precio original (suma de productos * cantidad)
  SELECT COALESCE(SUM(p.price * bp.quantity), 0) INTO original_total
  FROM bundle_products bp
  JOIN products p ON bp.product_id = p.id
  WHERE bp.bundle_id = NEW.id;
  
  -- Calcular el precio final con descuento
  final_price = original_total * (1 - NEW.discount_percentage / 100);
  
  -- Actualizar los precios en la tabla bundles
  UPDATE bundles 
  SET 
    original_price = original_total,
    bundle_price = final_price,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular el precio cuando se añaden/modifican productos al bundle
CREATE TRIGGER update_bundle_price
AFTER INSERT OR UPDATE OR DELETE ON bundle_products
FOR EACH ROW EXECUTE FUNCTION calculate_bundle_price();
