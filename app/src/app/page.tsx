import { getSiteConfig } from "@/lib/getSiteConfig";
import { supabaseAdmin } from "@/utils/supabase/admin";
import HeroSection from "@/components/HeroSection";
import CountdownTimer from "@/components/CountdownTimer";
import EventDetails from "@/components/EventDetails";
import EventSchedule from "@/components/EventSchedule";
import VenueMap from "@/components/VenueMap";
import RsvpForm from "@/components/RsvpForm";
import OurStory from "@/components/OurStory";
import PhotoGallery from "@/components/PhotoGallery";
import GiftRegistry from "@/components/GiftRegistry";
import TravelInfo from "@/components/TravelInfo";
import FaqSection from "@/components/FaqSection";
import WishesWall from "@/components/WishesWall";
import Footer from "@/components/Footer";
import EnvelopeModal from "@/components/EnvelopeModal";
import ScrollReveal from "@/components/ScrollReveal";
import FloatingPetals from "@/components/FloatingPetals";
import QuranVerse from "@/components/QuranVerse";
import GuestPassButton from "@/components/GuestPassButton";
import BackgroundVideo from "@/components/BackgroundVideo";
import CoupleProfile from "@/components/CoupleProfile";
import { generatePassQrDataUrl, buildPassUrl } from "@/lib/qrcode";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { token } = await searchParams;
  const config = await getSiteConfig();

  let guestName: string | undefined;
  let guestPass: { plusOneName?: string; checkedIn: boolean; qrDataUrl: string } | undefined;

  if (token) {
    try {
      const { data } = await supabaseAdmin
        .from("guests")
        .select("name, attending, plus_one_name, checked_in")
        .eq("token", token)
        .single();
      if (data) {
        guestName = data.name;
        if (data.attending === true) {
          const qrDataUrl = await generatePassQrDataUrl(buildPassUrl(token));
          guestPass = {
            plusOneName: data.plus_one_name ?? undefined,
            checkedIn: data.checked_in ?? false,
            qrDataUrl,
          };
        }
      }
    } catch {
      // Guest lookup failure should never break the page
    }
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#9a7d5a]">
        <p>Setting up your invitation...</p>
      </div>
    );
  }

  return (
    <main className="relative">
      <BackgroundVideo videoUrl={config.cover_video_url} posterUrl={config.cover_photo_url} />

      <EnvelopeModal
        partnerOneName={config.partner_one_name}
        partnerTwoName={config.partner_two_name}
        weddingDate={config.wedding_date}
        coverPhotoUrl={config.cover_photo_url}
        spotifyPlaylistUrl={config.spotify_playlist_url}
        guestName={guestName}
      />

      {/* Page-wide subtle petal layer (fixed, low opacity) */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40">
        <FloatingPetals count={12} />
      </div>

      <HeroSection config={config} />

      {config.wedding_date && (
        <ScrollReveal direction="scale">
          <CountdownTimer weddingDate={config.wedding_date} />
        </ScrollReveal>
      )}

      <ScrollReveal direction="up">
        <CoupleProfile
          partnerOneName={config.partner_one_name}
          partnerTwoName={config.partner_two_name}
          partnerOnePhotoUrl={config.partner_one_photo_url}
          partnerTwoPhotoUrl={config.partner_two_photo_url}
          partnerOneFullName={config.partner_one_full_name}
          partnerTwoFullName={config.partner_two_full_name}
        />
      </ScrollReveal>

      <ScrollReveal direction="scale">
        <QuranVerse />
      </ScrollReveal>

      {config.story_text && (
        <ScrollReveal direction="up">
          <OurStory
            storyText={config.story_text}
            storyTextEn={config.story_text_en}
            partnerOneName={config.partner_one_name}
            partnerTwoName={config.partner_two_name}
          />
        </ScrollReveal>
      )}

      <ScrollReveal direction="up">
        <EventDetails config={config} />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <EventSchedule schedule={config.schedule_json} />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <VenueMap
          venueName={config.venue_name}
          venueAddress={config.venue_address}
          mapsUrl={config.venue_maps_url}
        />
      </ScrollReveal>

      {config.gallery_photos_json?.length > 0 && (
        <ScrollReveal direction="scale">
          <PhotoGallery photos={config.gallery_photos_json} />
        </ScrollReveal>
      )}

      {(config.gift_qr_url || config.bank_name || config.bank_account_number || (config.bank_accounts_json && config.bank_accounts_json.length > 0)) && (
        <ScrollReveal direction="up">
          <GiftRegistry
            qrUrl={config.gift_qr_url}
            bankAccounts={config.bank_accounts_json}
            bankName={config.bank_name}
            bankAccountNumber={config.bank_account_number}
            bankAccountName={config.bank_account_name}
          />
        </ScrollReveal>
      )}

      {config.travel_info && (
        <ScrollReveal direction="left">
          <TravelInfo travelInfo={config.travel_info} travelInfoEn={config.travel_info_en} />
        </ScrollReveal>
      )}

      {config.faq_json?.length > 0 && (
        <ScrollReveal direction="up">
          <FaqSection items={config.faq_json} />
        </ScrollReveal>
      )}

      <ScrollReveal direction="up">
        <RsvpForm rsvpDeadline={config.rsvp_deadline} guestName={guestName} />
      </ScrollReveal>

      <ScrollReveal direction="up">
        <WishesWall />
      </ScrollReveal>

      <Footer
        partnerOneName={config.partner_one_name}
        partnerTwoName={config.partner_two_name}
        weddingDate={config.wedding_date}
      />

      {token && guestPass && (
        <GuestPassButton
          token={token}
          guestName={guestName!}
          plusOneName={guestPass.plusOneName}
          checkedIn={guestPass.checkedIn}
          qrDataUrl={guestPass.qrDataUrl}
        />
      )}
    </main>
  );
}