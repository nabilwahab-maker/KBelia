import { B2BListing, BusinessListing, CapsuleBooking, CapsuleSlot, YouthProgram } from '../types';
import kioskAgrotekImg from '../assets/images/kiosk_agrotek_jeli_1794628835515.jpg';
import kioskKrafBatikImg from '../assets/images/kiosk_kraf_batik_tumpat_1794628835744.jpg';
import kioskKulinariImg from '../assets/images/kiosk_kulinari_pasirmas_1794628835967.jpg';
import programGeranInkubasiImg from '../assets/images/program_geran_inkubasi_1794628836100.jpg';
import acaraKarnivalBeliaImg from '../assets/images/acara_karnival_belia_1794628836704.jpg';
import ruangNiagaBannerImg from '../assets/images/ruang_niaga_banner_1794660276016.jpg';
import b2bKopiSangaiImg from '../assets/images/b2b_kopi_sangai_1794660276406.jpg';
import b2bSambalPesImg from '../assets/images/b2b_sambal_pes_1794660276429.jpg';
import b2bBatikSeragamImg from '../assets/images/b2b_batik_seragam_1794660276746.jpg';

export const DEFAULT_KIOSK_IMAGE = '/assets/generated/kiosk_modular_kbelia.jpg';
export const STUDIO_KIOSK_IMAGE = '/assets/generated/kiosk_modular_kbelia_1793924253417.jpg';

export {
  kioskAgrotekImg,
  kioskKrafBatikImg,
  kioskKulinariImg,
  programGeranInkubasiImg,
  acaraKarnivalBeliaImg,
  ruangNiagaBannerImg,
  b2bKopiSangaiImg,
  b2bSambalPesImg,
  b2bBatikSeragamImg
};

const LEGACY_NON_KIOSK_IMAGES = [
  'madu_kelulut_rimba',
  'wau_bulan_kelantan',
  'keropok_lekor_kelantan'
];

export const isLegacyProductSlotImage = (url?: string): boolean => {
  if (!url) return true;
  return LEGACY_NON_KIOSK_IMAGES.some((key) => url.includes(key));
};

export const inferKioskImageByContext = (context: {
  slotId?: string;
  slotCode?: string;
  slotName?: string;
  district?: string;
  businessCategory?: string;
}): string => {
  const combined = `${context.slotId || ''} ${context.slotCode || ''} ${context.slotName || ''} ${context.district || ''} ${context.businessCategory || ''}`.toLowerCase();

  if (combined.includes('jeli') || combined.includes('agro') || combined.includes('pertanian')) {
    return kioskAgrotekImg;
  }
  if (combined.includes('tumpat') || combined.includes('tmp') || combined.includes('kraf') || combined.includes('batik') || combined.includes('fesyen')) {
    return kioskKrafBatikImg;
  }
  if (combined.includes('pasir mas') || combined.includes('pm-01') || combined.includes('tradisi') || combined.includes('kulinari') || combined.includes('makanan')) {
    return kioskKulinariImg;
  }
  if (combined.includes('kreatif') || combined.includes('digital') || combined.includes('studio') || combined.includes('kb-02')) {
    return STUDIO_KIOSK_IMAGE;
  }
  return DEFAULT_KIOSK_IMAGE;
};

export const resolveSlotImage = (slot?: Partial<CapsuleSlot> | null): string => {
  if (!slot) return DEFAULT_KIOSK_IMAGE;
  if (slot.imageUrl && !isLegacyProductSlotImage(slot.imageUrl)) {
    return slot.imageUrl;
  }
  return inferKioskImageByContext({
    slotId: slot.id,
    slotCode: slot.code,
    slotName: slot.name,
    district: slot.district
  });
};

export const resolveBookingKioskImage = (
  booking: Partial<CapsuleBooking>,
  slots: CapsuleSlot[] = []
): string => {
  const matchedSlot = slots.find(
    (s) => (booking.slotId && s.id === booking.slotId) || (booking.slotCode && s.code === booking.slotCode)
  );
  if (matchedSlot) {
    return resolveSlotImage(matchedSlot);
  }
  return inferKioskImageByContext({
    slotId: booking.slotId,
    slotCode: booking.slotCode,
    slotName: booking.slotName,
    businessCategory: booking.businessCategory
  });
};

export const resolveProgramImage = (program: Partial<YouthProgram>): string => {
  if (program.imageUrl && program.imageUrl.trim().length > 0) {
    return program.imageUrl;
  }
  if (program.category === 'Bengkel & Latihan' || program.category === 'Pameran & Ekspo') {
    return acaraKarnivalBeliaImg;
  }
  return programGeranInkubasiImg;
};

export const resolveEventImage = (category: string, imageUrl?: string): string => {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }
  if (category === 'pitching') {
    return programGeranInkubasiImg;
  }
  return acaraKarnivalBeliaImg;
};

export const resolveB2BImage = (item: Partial<B2BListing>): string => {
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl;
  }
  const combined = `${item.id || ''} ${item.title || ''} ${item.authorBusiness || ''} ${item.description || ''}`.toLowerCase();
  if (combined.includes('kopi') || combined.includes('kafe') || combined.includes('espresso') || combined.includes('minuman')) {
    return b2bKopiSangaiImg;
  }
  if (combined.includes('batik') || combined.includes('seragam') || combined.includes('totebag') || combined.includes('apron') || combined.includes('kraf')) {
    return b2bBatikSeragamImg;
  }
  if (combined.includes('sambal') || combined.includes('pes') || combined.includes('masak') || combined.includes('makanan') || combined.includes('kuih')) {
    return b2bSambalPesImg;
  }
  return item.type === 'supply' ? b2bSambalPesImg : ruangNiagaBannerImg;
};

const FEMALE_AVATARS = [
  '/assets/generated/usahawan_belia_wanita.jpg',
  '/assets/generated/avatar_youth_female_1793924250745.jpg'
];

const MALE_AVATARS = [
  '/assets/generated/usahawan_belia_lelaki.jpg',
  '/assets/generated/avatar_youth_male_1793924250192.jpg'
];

const hashTextIndex = (text: string, modulo: number): number => {
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) {
    sum = (sum + text.charCodeAt(i)) % 997;
  }
  return modulo > 0 ? sum % modulo : 0;
};

export const resolveMenteeVisuals = (
  info: {
    applicantId?: string;
    entrepreneurName?: string;
    businessName?: string;
    category?: string;
  },
  businesses: BusinessListing[] = []
): { avatarUrl: string; businessUrl: string } => {
  const nameNorm = (info.entrepreneurName || '').trim().toLowerCase();
  const bizNorm = (info.businessName || '').trim().toLowerCase();

  const matchedBiz = businesses.find((b) => {
    if (info.applicantId && b.ownerId && b.ownerId === info.applicantId) return true;
    if (bizNorm && b.businessName && b.businessName.trim().toLowerCase() === bizNorm) return true;
    if (nameNorm && b.ownerName && b.ownerName.trim().toLowerCase() === nameNorm) return true;
    return false;
  });

  const isFemale = /\b(binti|bt|siti|nur|nurul|syafiqah|aminah|izzah|farah|aisyah|puan|cik|aina|nadia|hajar)\b/i.test(
    info.entrepreneurName || ''
  );
  const avatarPool = isFemale ? FEMALE_AVATARS : MALE_AVATARS;
  const fallbackAvatar = avatarPool[hashTextIndex(nameNorm || bizNorm || 'kbelia', avatarPool.length)];

  const avatarUrl =
    matchedBiz?.logoUrl && matchedBiz.logoUrl.trim().length > 0
      ? matchedBiz.logoUrl.trim()
      : fallbackAvatar;

  let businessUrl = matchedBiz?.bannerUrl && matchedBiz.bannerUrl.trim().length > 0
    ? matchedBiz.bannerUrl.trim()
    : '';

  if (!businessUrl) {
    const combined = `${info.businessName || ''} ${info.category || ''} ${matchedBiz?.category || ''}`.toLowerCase();
    if (combined.includes('sambal') || combined.includes('pes') || combined.includes('masak')) {
      businessUrl = b2bSambalPesImg;
    } else if (
      combined.includes('kopi') ||
      combined.includes('kafe') ||
      combined.includes('coffee') ||
      combined.includes('espresso') ||
      combined.includes('pastry')
    ) {
      businessUrl = '/assets/generated/kopi_nissem_melaka.jpg';
    } else if (
      combined.includes('batik') ||
      combined.includes('songket') ||
      combined.includes('kraf') ||
      combined.includes('fesyen') ||
      combined.includes('tenun')
    ) {
      businessUrl = '/assets/generated/batik_canting_kelantan.jpg';
    } else if (
      combined.includes('tech') ||
      combined.includes('multimedia') ||
      combined.includes('studio') ||
      combined.includes('digital') ||
      combined.includes('perisian')
    ) {
      businessUrl = STUDIO_KIOSK_IMAGE;
    } else if (
      combined.includes('agro') ||
      combined.includes('kelulut') ||
      combined.includes('madu') ||
      combined.includes('pertanian')
    ) {
      businessUrl = kioskAgrotekImg;
    } else if (combined.includes('akok') || combined.includes('kuih')) {
      businessUrl = '/assets/generated/akok_kelantan_tradisi.jpg';
    } else {
      businessUrl = '/assets/generated/product_kelantan_delights_1793924253401.jpg';
    }
  }

  return { avatarUrl, businessUrl };
};
