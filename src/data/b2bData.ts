import { B2BListing } from '../types';
import {
  b2bKopiSangaiImg,
  b2bSambalPesImg,
  b2bBatikSeragamImg
} from '../utils/visualAssets';

export const INITIAL_B2B_LISTINGS: B2BListing[] = [
  {
    id: 'b2b-1',
    ownerId: 'demo-tenant-1',
    authorName: 'Ahmad Faizul',
    authorBusiness: "D'Kelate Artisan Coffee & Akok Tart",
    district: 'Bachok',
    type: 'demand',
    title: 'Mencari Pembekal Biji Kopi Sangai Tempatan',
    description:
      'Memerlukan bekalan tetap 15-20kg biji kopi gred premium setiap minggu untuk operasi kiosk belia.',
    whatsapp: '60123456781',
    imageUrl: b2bKopiSangaiImg,
    date: 'Hari ini'
  },
  {
    id: 'b2b-2',
    ownerId: 'demo-tenant-3',
    authorName: 'Harith Iskandar',
    authorBusiness: 'Aroma Dapur Pantai',
    district: 'Tumpat',
    type: 'supply',
    title: 'Membekal Pes Masakan & Sambal Siap Pek Kiosk',
    description:
      'Sedia membekal pek borong sambal bilis dan pes masakan Pantai Timur dengan margin 35% kepada pengusaha kiosk.',
    whatsapp: '60123456782',
    imageUrl: b2bSambalPesImg,
    date: 'Semalam'
  },
  {
    id: 'b2b-3',
    ownerId: 'demo-tenant-2',
    authorName: 'Nur Syafiqah',
    authorBusiness: 'Batik Belia Kontemporari',
    district: 'Kota Bharu',
    type: 'supply',
    title: 'Tempahan Seragam Batik & Totebag Korporat Belia',
    description:
      'Menerima tempahan borong apron kiosk, baju seragam pasukan niaga dan cenderamata batik Kelantan.',
    whatsapp: '60123456783',
    imageUrl: b2bBatikSeragamImg,
    date: '2 hari lepas'
  }
];
