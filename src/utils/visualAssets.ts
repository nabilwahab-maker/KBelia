import { CapsuleBooking, CapsuleSlot, YouthProgram } from '../types';
import kioskAgrotekImg from '../assets/images/kiosk_agrotek_jeli_1794628835515.jpg';
import kioskKrafBatikImg from '../assets/images/kiosk_kraf_batik_tumpat_1794628835744.jpg';
import kioskKulinariImg from '../assets/images/kiosk_kulinari_pasirmas_1794628835967.jpg';
import programGeranInkubasiImg from '../assets/images/program_geran_inkubasi_1794628836100.jpg';
import acaraKarnivalBeliaImg from '../assets/images/acara_karnival_belia_1794628836704.jpg';

export const DEFAULT_KIOSK_IMAGE = '/assets/generated/kiosk_modular_kbelia.jpg';
export const STUDIO_KIOSK_IMAGE = '/assets/generated/kiosk_modular_kbelia_1793924253417.jpg';

export {
  kioskAgrotekImg,
  kioskKrafBatikImg,
  kioskKulinariImg,
  programGeranInkubasiImg,
  acaraKarnivalBeliaImg
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
