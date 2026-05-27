export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  attending?: boolean;
  plus_one_name?: string;
  group_name?: string;
  side?: string;
  message?: string;
  submitted_at: string;
  token: string;
  checked_in: boolean;
  checked_in_at?: string;
  email_sent: boolean;
  whatsapp_status?: 'sent' | 'delivered' | 'read' | 'failed' | null;
  whatsapp_message_id?: string;
  is_vip: boolean;
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
  travel_info?: string;
  travel_info_en?: string;
  faq_json: FaqItem[];
  schedule_json: ScheduleItem[];
  gallery_photos_json: string[];
  site_password_enabled: boolean;
  site_password_hash?: string;
  spotify_playlist_url?: string;
  updated_at: string;
}
