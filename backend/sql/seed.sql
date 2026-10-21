-- ============================================================================
-- ElegAI Seed Data — realistic sample catalog, demo users and profiles
-- ============================================================================

-- Single administrator account ----------------------------------------------
-- Customers create their own accounts through the storefront.
-- The admin signs in at /admin/login with:
--   ElegaiAdmin / Admin@123x
INSERT INTO users (name, email, password, role) VALUES
('ElegaiAdmin', 'elegaiadmin@elegai.com', '$2a$10$AdI6PeOa/soaeZdOHa4Dp.2DDfSdzCLYpy5QB/7YrozJz9fGlnBsa', 'admin');

-- Products ------------------------------------------------------------------
INSERT INTO products (name, description, price, category, color, available_sizes, stock, image_url) VALUES
-- Bridal Gowns
('Elegant Ivory A-Line Wedding Gown',
 'A timeless A-line silhouette in ivory duchess satin with a sweetheart neckline, delicate lace bodice and sweeping chapel train. Designed to move beautifully with you from ceremony to celebration.',
 45000.00, 'Bridal Gowns', 'Ivory', '["XS","S","M","L","XL"]', 12, '/images/prod-gown-ivory.jpg'),
('Classic Ball Gown with Sweetheart Neckline',
 'The quintessential princess ball gown: corseted bodice, full tulle skirt and hand-beaded bodice details. Pure romance for the grandest entrances.',
 58000.00, 'Bridal Gowns', 'White', '["XS","S","M","L"]', 8, '/images/cat-bridal.jpg'),
('Modern Mermaid Bridal Gown',
 'Sleek mermaid silhouette with a dramatic flare at the knee. Structured bodice and subtly shimmering tulle make this a statement for the modern bride.',
 52000.00, 'Bridal Gowns', 'Ivory', '["S","M","L"]', 10, '/images/prod-gown-mermaid.jpg'),
('Lace Fit-and-Flare Bridal Dress',
 'Chantilly lace over a fit-and-flare skirt with illusion long sleeves and a low open back. Delicate, romantic, unforgettable.',
 48500.00, 'Bridal Gowns', 'White', '["XS","S","M"]', 7, '/images/cat-bridal.jpg'),

-- Evening Gowns
('Sapphire Sequin Evening Gown',
 'A show-stopping column gown hand-embellished with midnight-blue sequins. Mermaid-inspired fit that catches the light with every step.',
 18500.00, 'Evening Gowns', 'Navy', '["S","M","L"]', 15, '/images/cat-evening.jpg'),
('Scarlet Floor-Length Evening Gown',
 'Bold, fluid and elegant — a scarlet crepe evening gown with a draped cowl neckline and side slit. Made for gala entrances.',
 16800.00, 'Evening Gowns', 'Red', '["S","M"]', 14, '/images/prod-gown-red.jpg'),
('Emerald Velvet Evening Gown',
 'Sumptuous emerald velvet with a slim silhouette, off-shoulder neckline and graceful train. Opulence in every fold.',
 19200.00, 'Evening Gowns', 'Green', '["M","L"]', 9, '/images/cat-evening.jpg'),
('Midnight Lace Evening Gown',
 'Black floral lace over a soft satin base with a high neck and sheer back panel. Sophisticated, mysterious, timeless.',
 17400.00, 'Evening Gowns', 'Black', '["S","M","L"]', 11, '/images/cat-evening.jpg'),

-- Formal Dresses
('Little Black Cocktail Dress',
 'The essential LBD: tailored sheath silhouette, bateau neckline and a flirty knee-length hem. Effortless elegance for any evening event.',
 8900.00, 'Formal Dresses', 'Black', '["XS","S","M","L"]', 20, '/images/cat-formal.jpg'),
('Blush Wrap Formal Dress',
 'A soft blush wrap dress with a V-neckline and midi hem that flatters every figure. Feminine, comfortable, refined.',
 9800.00, 'Formal Dresses', 'Pink', '["XS","S","M"]', 16, '/images/cat-formal.jpg'),
('Champagne Slip Formal Dress',
 'A bias-cut champagne satin slip dress with delicate straps and a bias drape. Understated glamour that speaks volumes.',
 10200.00, 'Formal Dresses', 'Champagne', '["S","M"]', 13, '/images/cat-formal.jpg'),
('Navy A-Line Formal Dress',
 'A polished navy A-line dress with short sleeves and a subtle side drape. The dependable choice for corporate galas and graduation.',
 9500.00, 'Formal Dresses', 'Navy', '["M","L"]', 18, '/images/cat-formal.jpg'),

-- Suits
('Tailored Charcoal Wool Suit',
 'A sharp two-piece suit in Italian wool blend with a notch lapel and tapered trousers. Business-meets-occasion polish.',
 22000.00, 'Suits', 'Charcoal', '["S","M","L","XL"]', 10, '/images/cat-suit.jpg'),
('Classic Black Tuxedo Suit',
 'The timeless black-tie tuxedo: satin peak lapels, covered buttons and flat-front trousers. Every gentleman needs one.',
 25000.00, 'Suits', 'Black', '["S","M","L","XL"]', 8, '/images/cat-suit.jpg'),
('Navy Two-Button Suit',
 'A versatile navy suit with a modern two-button cut, half-canvassed construction and crisp lapels. Weddings, galas, meetings.',
 21500.00, 'Suits', 'Navy', '["S","M","L"]', 12, '/images/cat-suit.jpg'),
('Slim-Fit Midnight Suit',
 'A contemporary slim-fit suit in midnight black with a soft shoulder and tapered leg. Sharp, modern, confident.',
 23800.00, 'Suits', 'Black', '["M","L"]', 6, '/images/cat-suit.jpg'),

-- Barongs
('Juspol Barong Tagalog',
 'A lightweight juspol barong with hand-embroidered chest pattern and mother-of-pearl buttons. The national formal wear, beautifully crafted.',
 6500.00, 'Barongs', 'White', '["S","M","L","XL","XXL"]', 30, '/images/cat-barong.jpg'),
('Piña Barong Tagalog',
 'Luxurious piña-silk barong with intricate hand embroidery. A heritage piece for weddings and milestone celebrations.',
 9800.00, 'Barongs', 'Ivory', '["M","L","XL","XXL"]', 12, '/images/cat-barong.jpg'),
('Black Chambray Barong',
 'A modern barong in breathable black chambray with subtle tonal embroidery. Contemporary elegance for evening events.',
 7200.00, 'Barongs', 'Black', '["S","M","L","XL"]', 22, '/images/cat-barong.jpg'),
('Modern Brocade Barong',
 'A statement brocade barong in gold and black with a Mandarin collar. Distinctive, festive, unforgettable.',
 8400.00, 'Barongs', 'Gold', '["M","L","XL","XXL"]', 9, '/images/cat-barong.jpg'),

-- Accessories
('Crystal Bridal Tiara',
 'A hand-set crystal tiara on a delicate gold-tone band. The finishing touch every bride dreams of.',
 3500.00, 'Accessories', 'Gold', '["One Size"]', 25, '/images/cat-accessories.jpg'),
('Pearl Drop Earrings',
 'Freshwater pearl drops on gold-filled hooks. Quietly luxurious, endlessly versatile.',
 2800.00, 'Accessories', 'White', '["One Size"]', 40, '/images/cat-accessories.jpg'),
('Satin Evening Clutch',
 'A structured gold satin clutch with a crystal clasp and detachable chain. Fits the essentials, steals the spotlight.',
 2200.00, 'Accessories', 'Gold', '["One Size"]', 35, '/images/cat-accessories.jpg'),
('Silk Bow Tie & Pocket Square Set',
  'A classic silk bow tie with a matching pocket square in timeless black. Groom-ready polish in one set.',
  1800.00, 'Accessories', 'Black', '["One Size"]', 50, '/images/cat-accessories.jpg'),
-- Additional Products (expanded catalog)
-- Bridal Gowns
('Off-Shoulder Ball Gown',
  'Romantic off-shoulder ball gown with layered tulle skirt and beaded bodice. Perfect for fairy-tale weddings.',
  62000.00, 'Bridal Gowns', 'Ivory', '["XS","S","M"]', 5, '/images/prod-gown-offshore.jpg'),
('Sweetheart Lace Gown',
  'Sweetheart neckline gown with intricate all-over lace and subtle beadwork. Elegant and feminine for any bridal occasion.',
  55000.00, 'Bridal Gowns', 'Champagne', '["XS","S","M","L"]', 9, '/images/prod-gown-lace.jpg'),
-- Evening Gowns
('Rose Gold Sequin Gown',
  'Evening gown featuring rose gold sequin embellishment along the bodice and flowing skirt. Heads-turning sparkle.',
  21000.00, 'Evening Gowns', 'Rose Gold', '["M","L"]', 8, '/images/prod-gown-rose.jpg'),
('Iris Pearl Gown',
  'Soft pearl-embellished satin gown with one-shoulder neckline and draped skirt. Classic grace with a modern twist.',
  23500.00, 'Evening Gowns', 'Ivory', '["S","M","L"]', 11, '/images/prod-gown-pearl.jpg'),
-- Formal Dresses
('Metallic Gold Sheath Dress',
  'Bias-cut gold sheath dress with asymmetric draping. Evening event showstopper.',
  12500.00, 'Formal Dresses', 'Gold', '["XS","S","M"]', 17, '/images/prod-formal-gold.jpg'),
('Emerald Wrap Dress',
  'Wrap-style emerald green midi dress with V-neck and tie waist. Flattering for all body types.',
  9200.00, 'Formal Dresses', 'Emerald', '["XS","S","M","L"]', 22, '/images/prod-formal-emerald.jpg'),
-- Suits
('Tweed Wedding Suit',
  'Vintage-inspired tweed suit with velvet lapels and matching waistcoat. Unique wedding guest style.',
  28000.00, 'Suits', 'Tweed Brown', '["S","M","L","XL"]', 4, '/images/prod-suit-tweed.jpg'),
('Linen Summer Suit',
  'Lightweight linen suit in sand color, perfect for summer weddings and garden events. Breathable and sharp.',
  19800.00, 'Suits', 'Sand', '["M","L","XL"]', 15, '/images/prod-suit-linen.jpg'),
-- Barongs
('Embroidered Piña Barong',
  'Elegant piña-silk barong with extensive hand-embroidery along the front. Heritage piece for weddings.',
  11000.00, 'Barongs', 'Ivory', '["L","XL","XXL"]', 7, '/images/prod-barong-piña.jpg'),
('Red Barong with Gold Embroidery',
  'Bold red barong with intricate gold thread embroidery. Festive and distinctive for celebrations.',
  9500.00, 'Barongs', 'Red', '["M","L","XL"]', 10, '/images/prod-barong-red.jpg'),
-- Accessories
('Beaded Clutch Bag',
  'Evening beaded clutch bag in silver with detachable chain strap. Perfect for formal events.',
  3200.00, 'Accessories', 'Silver', '["One Size"]', 30, '/images/prod-accessories-beaded.jpg'),
('Statement Necklace Set',
  'Gold-tone statement necklace with crystal accents and matching earrings. Instant glamour.',
  4500.00, 'Accessories', 'Gold', '["One Size"]', 45, '/images/prod-accessories-necklace.jpg'),
('White Gloves Set',
  'Elegant white satin gloves with lace trim. Classic bridal accessory for formal occasions.',
  1200.00, 'Accessories', 'White', '["One Size"]', 60, '/images/prod-accessories-gloves.jpg');
