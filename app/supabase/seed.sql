-- Run this in Supabase SQL Editor to seed sample wedding data
-- Update with your real details later via the Admin Panel

UPDATE site_config SET
  partner_one_name      = 'Hanan',
  partner_two_name      = 'Hanafi',
  wedding_date          = '2026-08-07',
  wedding_time          = '4:00 PM',
  venue_name            = 'The Grand Ballroom',
  venue_address         = 'Jl. Sudirman No. 1, Jakarta, Indonesia',
  venue_maps_url        = NULL,
  dress_code            = 'Semi-Formal / Batik',
  rsvp_deadline         = '2026-07-25',
  cover_photo_url       = NULL,
  theme_color_primary   = '#c9a96e',
  theme_color_secondary = '#faedcd',
  theme_font            = 'Playfair Display',
  schedule_json = '[
    {"time": "4:00 PM", "title": "Guest Arrival", "description": "Welcome drinks and registration"},
    {"time": "4:30 PM", "title": "Akad / Ceremony", "description": "The wedding ceremony begins"},
    {"time": "6:00 PM", "title": "Cocktail Hour", "description": "Mingle and congratulate the couple"},
    {"time": "7:00 PM", "title": "Reception Dinner", "description": "Dinner and entertainment"},
    {"time": "9:30 PM", "title": "Closing", "description": "Thank you for celebrating with us!"}
  ]',
  faq_json = '[
    {"question": "Is there parking available?", "answer": "Yes, free parking is available at the venue."},
    {"question": "Can I bring children?", "answer": "Children are welcome at the ceremony. The reception is adults-only."}
  ]'
WHERE id = 1;
