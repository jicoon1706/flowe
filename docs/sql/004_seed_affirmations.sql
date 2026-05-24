-- Flowe Migration 004: Seed Data
-- Requires 001_init_schema.sql to have run first

BEGIN;

-- ============================================
-- BANK PRESETS (Malaysian banks)
-- ============================================
insert into public.bank_presets (name, color) values
  ('Maybank',      '#F8C000'),
  ('CIMB',         '#C8102E'),
  ('Public Bank',  '#003087'),
  ('RHB',          '#005DAA'),
  ('Hong Leong',   '#E31837'),
  ('AmBank',       '#E4002B'),
  ('Bank Islam',   '#00704A'),
  ('BSN',          '#0033A0'),
  ('Bank Rakyat',  '#006633'),
  ('HSBC',         '#DB0011'),
  ('Affin',        '#003087'),
  ('Alliance',     '#0068B3'),
  ('Other Bank',   '#888888');

-- ============================================
-- AFFIRMATIONS SEED DATA
-- ============================================
insert into public.affirmations (category, quote) values

-- SAVING
('saving', 'Every ringgit saved is a step towards financial freedom.'),
('saving', 'I deserve to save money for my future.'),
('saving', 'Saving is not about deprivation, it is about building security.'),
('saving', 'I attract abundance and save with joy.'),
('saving', 'My savings grow stronger every day.'),
('saving', 'I am in control of my spending and proud of my savings.'),
('saving', 'Small savings today lead to big victories tomorrow.'),
('saving', 'I honour my future self by saving today.'),

-- INVESTING
('investing', 'My money works as hard as I do.'),
('investing', 'I invest in my knowledge and watch my wealth grow.'),
('investing', 'Investing is a journey, not a race — I stay consistent.'),
('investing', 'I make wise financial decisions with confidence.'),
('investing', 'I trust the process of compound growth.'),
('investing', 'Every ringgit invested is a seed planted for tomorrow.'),
('investing', 'I am a magnet for smart investment opportunities.'),
('investing', 'I build wealth through patience and informed choices.'),

-- MINDSET
('mindset', 'I am worthy of financial success.'),
('mindset', 'My relationship with money is healthy and positive.'),
('mindset', 'I release all negative beliefs about wealth.'),
('mindset', 'I attract prosperity in all areas of my life.'),
('mindset', 'Money is a tool — I use it to create the life I want.'),
('mindset', 'I am grateful for the abundance flowing into my life.'),
('mindset', 'I deserve to live a financially free life.'),
('mindset', 'I choose to think like the rich and successful.'),
('mindset', 'Abundance is my birthright.'),
('mindset', 'I transform fear into confident financial action.'),

-- AWARENESS
('awareness', 'I track every ringgit with pride, not shame.'),
('awareness', 'Awareness precedes change — I am consciously creating my financial future.'),
('awareness', 'I celebrate every financial decision I make.'),
('awareness', 'Understanding my finances empowers me.'),
('awareness', 'I am present and intentional with every spend.'),
('awareness', 'Knowledge of my finances gives me freedom.'),
('awareness', 'I own my financial story and write my own ending.'),
('awareness', 'Every dollar I track is a act of self-love.'),
('awareness', 'I am fully aware of where my money flows.');

COMMIT;