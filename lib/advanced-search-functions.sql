-- Enable PostgreSQL extensions for advanced search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create search configuration for better text search
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS simple_unaccent (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION simple_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

-- Add search vectors to products table for full-text search
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple_unaccent', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple_unaccent', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple_unaccent', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_product_search_vector_trigger ON products;
CREATE TRIGGER update_product_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Update existing products with search vectors
UPDATE products SET 
  search_vector = 
    setweight(to_tsvector('simple_unaccent', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('simple_unaccent', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('simple_unaccent', COALESCE(category, '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING GIN(description gin_trgm_ops);

-- Advanced search function with relevance scoring
CREATE OR REPLACE FUNCTION search_products_advanced(
  search_query TEXT,
  category_filter TEXT[] DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  min_rating DECIMAL DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  page_limit INTEGER DEFAULT 12,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  image_url TEXT,
  stock INTEGER,
  category TEXT,
  rating DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  relevance_score REAL
) AS $$
DECLARE
  clean_query TEXT;
  tsquery_obj TSQUERY;
BEGIN
  -- Clean and prepare search query
  clean_query := trim(regexp_replace(search_query, '[^\w\s]', ' ', 'g'));
  
  -- Handle empty or very short queries
  IF length(clean_query) < 2 THEN
    RETURN QUERY
    SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock, 
           p.category, p.rating, p.created_at, p.updated_at, 0.0::REAL
    FROM products p
    WHERE (category_filter IS NULL OR p.category = ANY(category_filter))
      AND (min_price IS NULL OR p.price >= min_price)
      AND (max_price IS NULL OR p.price <= max_price)
      AND (min_rating IS NULL OR p.rating >= min_rating)
      AND p.stock > 0
    ORDER BY p.created_at DESC
    LIMIT page_limit OFFSET page_offset;
    RETURN;
  END IF;

  -- Create tsquery for full-text search
  BEGIN
    tsquery_obj := plainto_tsquery('simple_unaccent', clean_query);
  EXCEPTION WHEN OTHERS THEN
    tsquery_obj := to_tsquery('simple_unaccent', quote_literal(clean_query) || ':*');
  END;

  RETURN QUERY
  SELECT 
    p.id, p.name, p.description, p.price, p.image_url, p.stock,
    p.category, p.rating, p.created_at, p.updated_at,
    (
      -- Full-text search score (weighted)
      COALESCE(ts_rank_cd(p.search_vector, tsquery_obj), 0) * 10 +
      
      -- Exact name match bonus
      CASE WHEN lower(p.name) = lower(clean_query) THEN 50
           WHEN lower(p.name) LIKE lower(clean_query) || '%' THEN 25
           ELSE 0 END +
      
      -- Trigram similarity for fuzzy matching
      GREATEST(
        similarity(p.name, clean_query) * 20,
        COALESCE(similarity(p.description, clean_query), 0) * 10,
        COALESCE(similarity(p.category, clean_query), 0) * 5
      ) +
      
      -- Popularity bonus (based on rating and stock)
      COALESCE(p.rating, 0) * 2 +
      CASE WHEN p.stock > 10 THEN 5 ELSE 0 END
      
    )::REAL AS relevance_score
  FROM products p
  WHERE 
    -- Full-text search OR trigram similarity
    (p.search_vector @@ tsquery_obj 
     OR similarity(p.name, clean_query) > 0.3
     OR similarity(p.description, clean_query) > 0.2)
    
    -- Apply filters
    AND (category_filter IS NULL OR p.category = ANY(category_filter))
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_rating IS NULL OR p.rating >= min_rating)
    AND p.stock > 0
    
  ORDER BY 
    CASE 
      WHEN sort_by = 'relevance' THEN relevance_score
      WHEN sort_by = 'price-asc' THEN -p.price
      WHEN sort_by = 'price-desc' THEN p.price
      WHEN sort_by = 'rating-desc' THEN COALESCE(p.rating, 0)
      WHEN sort_by = 'newest' THEN EXTRACT(EPOCH FROM p.created_at)
      ELSE relevance_score
    END DESC,
    p.name ASC
  LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;
