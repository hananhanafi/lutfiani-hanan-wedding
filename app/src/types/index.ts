export interface RsvpSubmission {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  attending: boolean;
  plus_one_name?: string;
  group_name?: string;
  side?: string;
  message?: string;
  submitted_at: string;
  token: string;
  checked_in: boolean;
  checked_in_at?: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  attending?: boolean;
  plus_one_name?: string;
  group_name?: string;
  group_id?: string | null;
  side?: string;
  message?: string;
  submitted_at: string;
  token: string;
  checked_in: boolean;
  checked_in_at?: string;
  email_sent: boolean;
  whatsapp_status?: 'sent' | 'delivered' | 'read' | 'failed' | null;
  whatsapp_message_id?: string;
  whatsapp_sent_by?: string | null;
  whatsapp_sender_number?: string | null;
  whatsapp_sent_at?: string | null;
  is_vip: boolean;
  created_by?: string | null;
  rsvp_submitted_at?: string | null;
  rsvp_submission_id?: string | null;
}

export interface GuestGroup {
  id: string;
  name: string;
  side?: string | null;
  notes?: string | null;
  position: number;
  token?: string;
  expected_pax?: number | null;   // manual override; null = auto
  expected_pax_auto?: number;     // computed from members + plus-ones
  expected_pax_effective?: number; // override ?? auto
  arrived_pax?: number;
  first_arrived_at?: string | null;
  last_arrived_at?: string | null;
  wa_group_jid?: string | null;
  wa_group_name?: string | null;
  created_at: string;
  updated_at?: string;
  guest_count?: number;
}

export interface ScheduleItem {
  time: string;
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
}

export interface FaqItem {
  question: string;
  question_en?: string;
  answer: string;
  answer_en?: string;
}

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface SiteConfig {
  id: number;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date?: string;
  wedding_time?: string;
  venue_name?: string;
  venue_address?: string;
  venue_maps_url?: string;
  dress_code?: string;
  rsvp_deadline?: string;
  cover_photo_url?: string;
  partner_one_photo_url?: string;
  partner_two_photo_url?: string;
  partner_one_full_name?: string;
  partner_two_full_name?: string;
  partner_one_parents?: string;
  partner_two_parents?: string;
  theme_color_primary: string;
  theme_color_secondary: string;
  theme_font: string;
  story_text?: string;
  story_text_en?: string;
  gift_registry_url?: string;
  gift_qr_url?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_accounts_json?: BankAccount[];
  travel_info?: string;
  travel_info_en?: string;
  faq_json: FaqItem[];
  schedule_json: ScheduleItem[];
  gallery_photos_json: string[];
  cover_video_url?: string;
  site_password_enabled: boolean;
  site_password_hash?: string;
  spotify_playlist_url?: string;
  background_music_url?: string;
  background_music_youtube_url?: string;
  updated_at: string;
}
