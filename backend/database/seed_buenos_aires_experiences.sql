-- Seed Script: Buenos Aires Experiences (November 5-20, 2025)
-- Description: 10 curated experiences showcasing Buenos Aires culture, food, and history
-- Location: Buenos Aires, Argentina

-- First, we need a host user with a wallet address
INSERT INTO users (id, email, full_name, username, wallet_address, role, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'buenosaires.host@mayhouse.com',
    'María González',
    'BuenosAiresGuide247',
    '0x037ce9723e75a088d8d1A9c188cf359425a21666', -- Your dev wallet
    'host',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Experience 1: Tango & Wine Evening in San Telmo
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba001-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Authentic Tango & Malbec Evening in Historic San Telmo',
    'Experience the soul of Buenos Aires through intimate tango performances paired with Argentina''s finest Malbec wines in a century-old milonga.',
    'Join us for an unforgettable evening where Buenos Aires comes alive. We''ll start at a traditional San Telmo wine bar, sampling three exceptional Malbec wines from Mendoza while I share stories of tango''s golden age. Then, we''ll walk to a hidden milonga where local dancers perform authentic tango - not the tourist show, but the real deal where porteños dance with passion. You''ll learn basic steps from a professional dancer and feel the music''s embrace. The night ends with empanadas and more wine as we watch the stars dance above the cobblestone streets.',
    'Unlike tourist tango shows, this is where real porteños dance. My family has been running this milonga for three generations, and the dancers you''ll see are neighborhood legends who''ve danced together for decades.',
    'I grew up in San Telmo watching my grandmother dance tango every Sunday. She taught me that tango isn''t just a dance - it''s the heartbeat of Buenos Aires. I want to share this intimate, authentic experience with travelers who want to feel the real soul of my city.',
    'music',
    'Tango & Wine',
    'Argentina',
    'Buenos Aires',
    'San Telmo',
    'Plaza Dorrego',
    'Meet at the fountain in Plaza Dorrego. I''ll be wearing a red beret and holding a tango music book.',
    180,
    2500.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 2: Street Art & Politics Walking Tour
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba002-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Political Street Art Tour: The Walls That Speak',
    'Decode Buenos Aires'' vibrant street art scene and discover how murals tell the story of Argentina''s turbulent history and passionate people.',
    'Buenos Aires has more political murals per capita than any city in Latin America. Join me on a 2.5-hour walking tour through Palermo and Villa Crespo where we''ll explore massive murals that document everything from the Mothers of Plaza de Mayo to modern political movements. I''ll translate the hidden messages, introduce you to local artists, and explain how street art became Argentina''s voice of resistance. We''ll visit 15+ murals, learn stencil techniques, and end at a street artist''s studio for mate tea and conversation.',
    'I''m personal friends with many of the artists whose work we''ll see. They''ll share stories directly with our group, and we''ll visit active creation sites where new murals are being painted.',
    'As a journalist covering social movements, I realized Buenos Aires'' street art tells stories mainstream media ignores. I started documenting murals in 2001 during the economic crisis and haven''t stopped since.',
    'art',
    'Street Art & Politics',
    'Argentina',
    'Buenos Aires',
    'Palermo',
    'Plaza Serrano (Plaza Cortázar)',
    'Meet at the main entrance of Plaza Serrano. Look for me with a blue backpack covered in stickers.',
    150,
    1800.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 3: Parrilla Masterclass & Asado Experience
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba003-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Argentine Asado Masterclass: Fire, Meat & Friendship',
    'Learn the sacred art of Argentine BBQ from a third-generation parrillero, and understand why asado is Argentina''s ritual of community.',
    'Asado isn''t just grilling - it''s Argentina''s soul on a plate. Join me at my family''s quinta (country house) in San Isidro where I''ll teach you everything: selecting cuts, building the perfect fire, timing each piece, and the unwritten rules of asado culture. We''ll prepare chorizo, morcilla, vacío, and my secret chimichurri recipe. While the meat slowly cooks over wood coals, we''ll make empanadas, drink Fernet con Coca, and I''ll share stories about why Sunday asado is sacred to every Argentine family. The feast includes wine, salads, and traditional desserts.',
    'This isn''t a restaurant - it''s my family home where we''ve hosted Sunday asados for 50 years. You''ll use my grandfather''s original parrilla and eat at the same table where my parents fell in love.',
    'My grandfather taught me that asado is about the time between lighting the fire and the first bite - that''s when strangers become friends. I want to share this tradition with travelers who understand that food is love.',
    'food',
    'Argentine BBQ & Cooking',
    'Argentina',
    'Buenos Aires',
    'San Isidro',
    'San Isidro Cathedral',
    'Meet at the main entrance of San Isidro Cathedral. I''ll drive us to my quinta (10 minutes away).',
    240,
    3500.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 4: Recoleta Cemetery Hidden Stories
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba004-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Recoleta Cemetery: Stories of Love, Power & Tragedy',
    'Explore South America''s most beautiful cemetery and discover the scandalous, romantic, and revolutionary stories behind Buenos Aires'' most famous eternal residents.',
    'Recoleta Cemetery isn''t just a tourist site - it''s an open-air museum where Argentina''s history comes alive. As a historian specializing in Buenos Aires elite families, I''ll take you beyond Eva Perón''s tomb to discover forgotten stories: the woman buried in her wedding dress waiting for a lover who never came, the president''s daughter who became a revolutionary, and the boxer whose monument moves positions. We''ll explore Art Nouveau mausoleums, decode masonic symbols, and I''ll reveal which tombs are empty and why. This is history, mystery, and architecture combined.',
    'I have access to family archives and personal letters that reveal stories never published. You''ll hear accounts based on original documents, not internet myths.',
    'My great-grandmother is buried here, and I grew up playing hide-and-seek among these tombs. I became a historian to understand the people behind these elaborate monuments.',
    'history',
    'Cemetery & Architecture',
    'Argentina',
    'Buenos Aires',
    'Recoleta',
    'Recoleta Cemetery Main Entrance',
    'Meet at the main entrance gate on Junín street. I''ll have a small Argentine flag on my bag.',
    120,
    1500.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 5: Mate & Conversation in a Traditional Café
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba005-e29b-41d4-a716-446655440005'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Mate Ceremony & Porteño Philosophy in a Historic Café',
    'Learn the ritual of mate drinking and engage in deep philosophical conversations about life, love, and being Argentine in Buenos Aires'' oldest café.',
    'Porteños don''t just drink mate - we philosophize with it. Join me at Café Tortoni (opened 1858) where intellectuals, artists, and revolutionaries have gathered for 165 years. I''ll teach you the proper mate ritual, the unspoken rules, why the cebador is sacred, and how to prepare perfect mate. Then, like true porteños, we''ll dive into deep conversation about tango, football, politics, Borges, and why Buenos Aires thinks it''s the Paris of South America. We''ll also sample medialunas, alfajores, and dulce de leche while jazz plays softly in this timeless café.',
    'This isn''t a tour - it''s a genuine porteño experience. We''ll sit for hours like locals do, and I''ll teach you how to think like a Buenos Aires philosopher.',
    'I''m a philosophy professor who believes mate breaks down walls between strangers. Some of my best friendships started over shared mate in cafés.',
    'culture',
    'Mate & Local Culture',
    'Argentina',
    'Buenos Aires',
    'Centro',
    'Café Tortoni',
    'Meet inside Café Tortoni at the second table from the entrance. I''ll have my mate gourd on the table.',
    90,
    1200.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 6: La Boca Football & Passion Tour
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba006-e29b-41d4-a716-446655440006'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'La Boca: Football, Passion & Boca Juniors Legends',
    'Experience the most passionate football neighborhood in the world, meet Boca Juniors fanatics, and understand why football is religion in Argentina.',
    'La Boca isn''t just colorful houses - it''s the birthplace of Argentine football passion. As a former Boca Juniors player, I''ll take you where tourists never go: local football clubs where kids dream of La Bombonera, the bar where Maradona celebrated victories, street shrines to Boca legends, and we''ll meet barra brava members who''ll explain the passion (safely, I promise!). We''ll eat choripán, visit the Boca Juniors museum, walk on streets named after legendary players, and if there''s a match day, feel the pre-game energy that makes Buenos Aires tremble.',
    'I played for Boca''s youth team and know current players personally. If timing allows, you might meet a legend or watch youth training sessions.',
    'Football saved my life. I grew up in La Boca''s toughest streets, and Boca Juniors gave me purpose. Now I share this passion with visitors who want to understand why we call it \"más que un club.\"',
    'culture',
    'Football & Sports Culture',
    'Argentina',
    'Buenos Aires',
    'La Boca',
    'Caminito Tourist Street',
    'Meet at the entrance of Caminito street (the colorful one). I''ll be wearing my Boca Juniors jersey.',
    150,
    1600.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 7: Palermo Soho Food Market Adventure
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba007-e29b-41d4-a716-446655440007'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Palermo Soho Food Safari: Markets, Street Food & Hidden Gems',
    'Taste your way through Palermo Soho''s hidden food scene with a chef who knows every artisan, vendor, and secret spot in the neighborhood.',
    'Forget the trendy restaurants - let me show you where chefs eat. We''ll start at Armenia Street''s artisan market, tasting fresh empanadas, regional cheeses, and craft beer. Then hidden stops: the best fugazzeta pizza in Buenos Aires, homemade pasta from an Italian nonna, choripán from a 70-year-old stand, and craft ice cream with flavors like dulce de leche con Malbec. Between tastings, I''ll share stories about Argentine immigration, food culture, and why porteños eat dinner at midnight. We''ll also visit my favorite spice shop and gourmet store where you can buy ingredients to take home.',
    'As a chef, I have relationships with every vendor. You''ll taste products not available to regular tourists and hear stories behind each family business.',
    'I left my restaurant job to explore neighborhood food culture. I realized the best Argentine food isn''t in fancy restaurants - it''s in street corners and family shops.',
    'food',
    'Markets & Street Food',
    'Argentina',
    'Buenos Aires',
    'Palermo Soho',
    'Plaza Armenia',
    'Meet at Plaza Armenia (the one with the dog park). I''ll have a wicker basket and wearing a chef''s bandana.',
    180,
    2200.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 8: Bookstore Bar Crawl in Literary Buenos Aires
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba008-e29b-41d4-a716-446655440008'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Literary Buenos Aires: Bookstores, Borges & Bohemian Bars',
    'Follow Borges'' footsteps through Buenos Aires'' legendary bookstores and literary bars, discovering why this city produces more writers per capita than anywhere on Earth.',
    'Buenos Aires has more bookstores per person than any city worldwide. As a literature professor and published poet, I''ll take you into this magical world: El Ateneo Grand Splendid (a theatre turned bookstore), Borges'' favorite haunts, underground poetry clubs, and bohemian bars where writers still argue about metaphors over wine. We''ll read passages in Spanish and English, discuss why Borges refused the Nobel Prize, visit the exact cafe where Cortázar wrote Rayuela, and end at a speakeasy where local poets perform. Between stops, I''ll share unpublished Buenos Aires literature and give you a curated reading list.',
    'I''ll share poems I''ve written about Buenos Aires and introduce you to local poets. We might crash a poetry reading if one''s happening.',
    'My grandmother was Borges'' librarian. She taught me that Buenos Aires isn''t a city - it''s a library where every street has a story to tell.',
    'culture',
    'Literature & Arts',
    'Argentina',
    'Buenos Aires',
    'Recoleta',
    'El Ateneo Grand Splendid Bookstore',
    'Meet inside El Ateneo Grand Splendid on the stage area. I''ll have a book of Borges poetry in hand.',
    150,
    1700.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 9: Milonga Night: Dance Like a Porteño
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba009-e29b-41d4-a716-446655440009'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Milonga Night: Tango Dancing For Real Beginners',
    'Learn authentic tango in an afternoon workshop, then dance with locals at an evening milonga where porteños welcome beginners with open arms.',
    'Most people think tango is too hard to learn. They''re wrong. In 3 hours, I''ll teach you enough to dance confidently at a real milonga. We start with a private lesson covering basic steps, embrace techniques, and milonga etiquette (yes, there are rules!). Then I''ll take you to a beginner-friendly milonga in Almagro where experienced dancers love dancing with newcomers. I''ll dance with you first, introduce you to friendly locals, and decode the secret cabeceo (eye contact invitation). You''ll dance with real porteños, drink wine, and experience the magic that makes people fall in love with tango. No performance pressure - just pure joy.',
    'I''ll teach you the cabeceo (invitation system) so you can actually dance with locals, not just watch. This is participatory, not performative.',
    'I was terrified at my first milonga. A kind stranger danced with me and changed my life. Now I pay it forward by introducing travelers to this beautiful community.',
    'music',
    'Tango Dancing',
    'Argentina',
    'Buenos Aires',
    'Almagro',
    'Club Almagro',
    'Meet at the entrance of Club Almagro on Medrano street. I''ll be in comfortable dance shoes and a black tango dress.',
    180,
    2000.00,
    'approved',
    NOW(),
    NOW()
);

-- Experience 10: Empanada Competition & Cooking Class
INSERT INTO experiences (
    id, host_id, title, promise, description, unique_element, host_story,
    experience_domain, experience_theme, country, city, neighborhood,
    meeting_landmark, meeting_point_details, duration_minutes,
    price_inr, status, created_at, updated_at
) VALUES (
    'ba010-e29b-41d4-a716-446655440010'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Ultimate Empanada Showdown: Cook, Compete & Feast',
    'Compete in a friendly empanada-making competition, learn family recipes from three Argentine provinces, and discover why empanadas define Argentina.',
    'Every Argentine family swears their empanada recipe is the best. Let''s find out! At my cooking studio in Palermo, I''ll teach you three regional styles: Tucumán (knife-cut beef), Salta (spicy with cumin), and Buenos Aires (creamy with olives and eggs). We''ll make masa from scratch, learn the perfect repulgue (fold), and compete for the best empanada. While they bake, we''ll prepare authentic chimichurri and criolla sauce. The winner gets bragging rights and a prize. We''ll feast on our creations with Malbec wine, and everyone gets recipe cards to recreate this at home. Vegetarian and vegan options available.',
    'This is my grandmother''s kitchen (literally). We''ll use her 60-year-old recipes and she might even pop in to judge the competition.',
    'My family comes from three different provinces, and holidays were always empanada debates. I learned every regional style to finally settle the argument (spoiler: they''re all delicious).',
    'food',
    'Cooking Class',
    'Argentina',
    'Buenos Aires',
    'Palermo',
    'Plaza Italia Metro Station',
    'Meet at the main entrance of Plaza Italia metro station. I''ll have a basket with empanada ingredients.',
    150,
    1900.00,
    'approved',
    NOW(),
    NOW()
);

-- Now create event runs for each experience (Nov 5-20, 2025)
-- Event runs for Experience 1: Tango & Wine (Nov 7, 12, 17)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba001-run1-41d4-a716-446655440001'::uuid, 'ba001-e29b-41d4-a716-446655440001'::uuid,
 '2025-11-07 19:00:00+00', '2025-11-07 22:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba001-run2-41d4-a716-446655440002'::uuid, 'ba001-e29b-41d4-a716-446655440001'::uuid,
 '2025-11-12 19:00:00+00', '2025-11-12 22:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba001-run3-41d4-a716-446655440003'::uuid, 'ba001-e29b-41d4-a716-446655440001'::uuid,
 '2025-11-17 19:00:00+00', '2025-11-17 22:00:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 2: Street Art (Nov 6, 11, 16)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba002-run1-41d4-a716-446655440004'::uuid, 'ba002-e29b-41d4-a716-446655440002'::uuid,
 '2025-11-06 10:00:00+00', '2025-11-06 12:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba002-run2-41d4-a716-446655440005'::uuid, 'ba002-e29b-41d4-a716-446655440002'::uuid,
 '2025-11-11 10:00:00+00', '2025-11-11 12:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba002-run3-41d4-a716-446655440006'::uuid, 'ba002-e29b-41d4-a716-446655440002'::uuid,
 '2025-11-16 10:00:00+00', '2025-11-16 12:30:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 3: Asado (Nov 8, 15)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba003-run1-41d4-a716-446655440007'::uuid, 'ba003-e29b-41d4-a716-446655440003'::uuid,
 '2025-11-08 12:00:00+00', '2025-11-08 16:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba003-run2-41d4-a716-446655440008'::uuid, 'ba003-e29b-41d4-a716-446655440003'::uuid,
 '2025-11-15 12:00:00+00', '2025-11-15 16:00:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 4: Cemetery (Nov 5, 10, 14, 19)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba004-run1-41d4-a716-446655440009'::uuid, 'ba004-e29b-41d4-a716-446655440004'::uuid,
 '2025-11-05 14:00:00+00', '2025-11-05 16:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba004-run2-41d4-a716-446655440010'::uuid, 'ba004-e29b-41d4-a716-446655440004'::uuid,
 '2025-11-10 14:00:00+00', '2025-11-10 16:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba004-run3-41d4-a716-446655440011'::uuid, 'ba004-e29b-41d4-a716-446655440004'::uuid,
 '2025-11-14 14:00:00+00', '2025-11-14 16:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba004-run4-41d4-a716-446655440012'::uuid, 'ba004-e29b-41d4-a716-446655440004'::uuid,
 '2025-11-19 14:00:00+00', '2025-11-19 16:00:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 5: Mate Café (Nov 6, 9, 13, 18, 20)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba005-run1-41d4-a716-446655440013'::uuid, 'ba005-e29b-41d4-a716-446655440005'::uuid,
 '2025-11-06 15:00:00+00', '2025-11-06 16:30:00+00', 2, 'scheduled', NOW(), NOW()),
('ba005-run2-41d4-a716-446655440014'::uuid, 'ba005-e29b-41d4-a716-446655440005'::uuid,
 '2025-11-09 15:00:00+00', '2025-11-09 16:30:00+00', 2, 'scheduled', NOW(), NOW()),
('ba005-run3-41d4-a716-446655440015'::uuid, 'ba005-e29b-41d4-a716-446655440005'::uuid,
 '2025-11-13 15:00:00+00', '2025-11-13 16:30:00+00', 2, 'scheduled', NOW(), NOW()),
('ba005-run4-41d4-a716-446655440016'::uuid, 'ba005-e29b-41d4-a716-446655440005'::uuid,
 '2025-11-18 15:00:00+00', '2025-11-18 16:30:00+00', 2, 'scheduled', NOW(), NOW()),
('ba005-run5-41d4-a716-446655440017'::uuid, 'ba005-e29b-41d4-a716-446655440005'::uuid,
 '2025-11-20 15:00:00+00', '2025-11-20 16:30:00+00', 2, 'scheduled', NOW(), NOW());

-- Event runs for Experience 6: Football (Nov 7, 14)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba006-run1-41d4-a716-446655440018'::uuid, 'ba006-e29b-41d4-a716-446655440006'::uuid,
 '2025-11-07 11:00:00+00', '2025-11-07 13:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba006-run2-41d4-a716-446655440019'::uuid, 'ba006-e29b-41d4-a716-446655440006'::uuid,
 '2025-11-14 11:00:00+00', '2025-11-14 13:30:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 7: Food Market (Nov 8, 12, 16)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba007-run1-41d4-a716-446655440020'::uuid, 'ba007-e29b-41d4-a716-446655440007'::uuid,
 '2025-11-08 10:00:00+00', '2025-11-08 13:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba007-run2-41d4-a716-446655440021'::uuid, 'ba007-e29b-41d4-a716-446655440007'::uuid,
 '2025-11-12 10:00:00+00', '2025-11-12 13:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba007-run3-41d4-a716-446655440022'::uuid, 'ba007-e29b-41d4-a716-446655440007'::uuid,
 '2025-11-16 10:00:00+00', '2025-11-16 13:00:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 8: Bookstores (Nov 9, 13, 18)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba008-run1-41d4-a716-446655440023'::uuid, 'ba008-e29b-41d4-a716-446655440008'::uuid,
 '2025-11-09 16:00:00+00', '2025-11-09 18:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba008-run2-41d4-a716-446655440024'::uuid, 'ba008-e29b-41d4-a716-446655440008'::uuid,
 '2025-11-13 16:00:00+00', '2025-11-13 18:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba008-run3-41d4-a716-446655440025'::uuid, 'ba008-e29b-41d4-a716-446655440008'::uuid,
 '2025-11-18 16:00:00+00', '2025-11-18 18:30:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 9: Milonga Dancing (Nov 10, 15, 20)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba009-run1-41d4-a716-446655440026'::uuid, 'ba009-e29b-41d4-a716-446655440009'::uuid,
 '2025-11-10 18:00:00+00', '2025-11-10 21:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba009-run2-41d4-a716-446655440027'::uuid, 'ba009-e29b-41d4-a716-446655440009'::uuid,
 '2025-11-15 18:00:00+00', '2025-11-15 21:00:00+00', 4, 'scheduled', NOW(), NOW()),
('ba009-run3-41d4-a716-446655440028'::uuid, 'ba009-e29b-41d4-a716-446655440009'::uuid,
 '2025-11-20 18:00:00+00', '2025-11-20 21:00:00+00', 4, 'scheduled', NOW(), NOW());

-- Event runs for Experience 10: Empanada Class (Nov 11, 17)
INSERT INTO event_runs (
    id, experience_id, start_datetime, end_datetime, max_capacity,
    status, created_at, updated_at
) VALUES
('ba010-run1-41d4-a716-446655440029'::uuid, 'ba010-e29b-41d4-a716-446655440010'::uuid,
 '2025-11-11 15:00:00+00', '2025-11-11 17:30:00+00', 4, 'scheduled', NOW(), NOW()),
('ba010-run2-41d4-a716-446655440030'::uuid, 'ba010-e29b-41d4-a716-446655440010'::uuid,
 '2025-11-17 15:00:00+00', '2025-11-17 17:30:00+00', 4, 'scheduled', NOW(), NOW());

-- Summary
SELECT 'Data seeding complete!' as message,
       (SELECT COUNT(*) FROM experiences WHERE city = 'Buenos Aires') as experiences_count,
       (SELECT COUNT(*) FROM event_runs WHERE experience_id IN (
           SELECT id FROM experiences WHERE city = 'Buenos Aires'
       )) as event_runs_count;


