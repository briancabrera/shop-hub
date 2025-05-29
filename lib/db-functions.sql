-- Function to decrease product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;
