const INDONESIAN_WORDS = [
  // Animals
  'kucing', 'anjing', 'harimau', 'singa', 'gajah', 'kuda', 'sapi', 'kambing',
  'ayam', 'bebek', 'burung', 'ikan', 'udang', 'kepiting', 'penyu', 'buaya',
  'ular', 'kura-kura', 'kelinci', 'hamster', 'tikus', 'monyet', 'gorila',
  'zebra', 'jerapah', 'kuda nil', 'badak', 'beruang', 'serigala', 'rubah',
  'rusa', 'babi', 'domba', 'kerbau', 'kelelawar', 'hiu', 'lumba-lumba',
  'paus', 'cumi', 'gurita', 'katak', 'cicak', 'tokek', 'bunglon', 'iguana',

  // Nature
  'pohon', 'bunga', 'daun', 'akar', 'batang', 'biji', 'buah', 'rumput',
  'hutan', 'kebun', 'sawah', 'ladang', 'gunung', 'bukit', 'lembah', 'ngarai',
  'sungai', 'danau', 'laut', 'pantai', 'pulau', 'teluk', 'selat', 'samudera',
  'air', 'tanah', 'batu', 'pasir', 'lumpur', 'salju', 'es', 'embun',
  'hujan', 'awan', 'angin', 'badai', 'petir', 'pelangi', 'matahari', 'bulan',
  'bintang', 'langit', 'cakrawala', 'fajar', 'senja', 'malam',

  // Food & Drinks
  'nasi', 'mie', 'roti', 'kue', 'pizza', 'burger', 'sate', 'rendang',
  'soto', 'bakso', 'gado-gado', 'tempe', 'tahu', 'sayur', 'sup', 'gulai',
  'ikan goreng', 'ayam goreng', 'telur', 'sambal', 'kerupuk', 'emping',
  'air putih', 'jus', 'susu', 'teh', 'kopi', 'es krim', 'coklat', 'permen',
  'apel', 'pisang', 'mangga', 'pepaya', 'jeruk', 'nanas', 'semangka', 'melon',
  'rambutan', 'durian', 'jambu', 'salak', 'tomat', 'wortel', 'bayam',
  'kangkung', 'kubis', 'bawang', 'jahe', 'kunyit', 'cabai', 'merica', 'garam',

  // Objects & Things
  'kursi', 'meja', 'lemari', 'tempat tidur', 'kasur', 'bantal', 'selimut',
  'pintu', 'jendela', 'atap', 'lantai', 'dinding', 'tangga', 'pagar',
  'pena', 'pensil', 'buku', 'kertas', 'gunting', 'penggaris', 'tas', 'dompet',
  'jam', 'kacamata', 'topi', 'sepatu', 'sandal', 'kaos kaki', 'celana', 'baju',
  'jaket', 'rok', 'dasi', 'ikat pinggang', 'kalung', 'gelang', 'cincin', 'anting',
  'handphone', 'laptop', 'tablet', 'televisi', 'radio', 'kamera', 'komputer',
  'mobil', 'motor', 'sepeda', 'bus', 'kereta', 'pesawat', 'kapal', 'perahu',
  'pisau', 'sendok', 'garpu', 'piring', 'mangkuk', 'gelas', 'botol', 'ember',

  // Places
  'rumah', 'apartemen', 'kantor', 'sekolah', 'universitas', 'rumah sakit',
  'pasar', 'mall', 'toko', 'restoran', 'warung', 'hotel', 'penginapan',
  'stadion', 'bioskop', 'perpustakaan', 'museum', 'masjid', 'gereja', 'pura',
  'penjara', 'kantor polisi', 'bank', 'pos', 'pelabuhan', 'bandara', 'terminal',
  'jalan', 'jembatan', 'terowongan', 'parkir', 'taman', 'lapangan', 'pantai',

  // Adjectives
  'besar', 'kecil', 'panjang', 'pendek', 'tinggi', 'rendah', 'lebar', 'sempit',
  'tebal', 'tipis', 'berat', 'ringan', 'keras', 'lembut', 'kasar', 'halus',
  'panas', 'dingin', 'hangat', 'sejuk', 'basah', 'kering', 'kotor', 'bersih',
  'cerah', 'gelap', 'terang', 'pucat', 'buram', 'jernih', 'keruh', 'pekat',
  'manis', 'asam', 'pahit', 'asin', 'pedas', 'gurih', 'segar', 'busuk',
  'cepat', 'lambat', 'kuat', 'lemah', 'sehat', 'sakit', 'tua', 'muda',
  'baru', 'lama', 'dekat', 'jauh', 'dalam', 'dangkal', 'penuh', 'kosong',

  // Colors
  'merah', 'putih', 'hitam', 'biru', 'hijau', 'kuning', 'orange', 'ungu',
  'coklat', 'abu-abu', 'pink', 'emas', 'perak', 'transparan',

  // Verbs (noun form / gerund)
  'terbang', 'berlari', 'berjalan', 'berenang', 'melompat', 'merayap',
  'makan', 'minum', 'tidur', 'bangun', 'main', 'belajar', 'bekerja',
  'memasak', 'menyanyi', 'menari', 'melukis', 'menulis', 'membaca',
  'berbicara', 'mendengar', 'melihat', 'mencium', 'menyentuh', 'merasa',

  // People & Professions
  'dokter', 'perawat', 'guru', 'polisi', 'tentara', 'petani', 'nelayan',
  'pedagang', 'koki', 'pilot', 'sopir', 'tukang', 'seniman', 'musisi',
  'atlet', 'aktor', 'presenter', 'penulis', 'ilmuwan', 'insinyur',
  'ibu', 'ayah', 'anak', 'kakak', 'adik', 'nenek', 'kakek', 'teman',

  // Abstract
  'cinta', 'persahabatan', 'kebahagiaan', 'kesedihan', 'ketakutan', 'keberanian',
  'mimpi', 'harapan', 'kenangan', 'waktu', 'uang', 'kekuasaan', 'keadilan',
  'kebebasan', 'perdamaian', 'perang', 'rahasia', 'misteri', 'bahaya',

  // Additional Indonesian specifics
  'batik', 'wayang', 'gamelan', 'angklung', 'keris', 'sarung', 'kebaya',
  'becak', 'ojek', 'angkot', 'gojek', 'warteg', 'kopitiam', 'lalapan',
  'kerokan', 'jamu', 'pijat', 'arisan', 'gotong royong', 'mudik', 'lebaran',
  'bali', 'lombok', 'java', 'sumatra', 'borneo', 'sulawesi', 'papua'
]

export const useIndonesianWords = () => {
  const suggest = (input: string, limit: number = 7): string[] => {
    if (!input || input.length < 1) return []

    const query = input.toLowerCase().trim()

    const results = INDONESIAN_WORDS.filter(word =>
      word.startsWith(query) || word.includes(query)
    )

    // Sort: starts-with first, then contains
    results.sort((a, b) => {
      const aStarts = a.startsWith(query)
      const bStarts = b.startsWith(query)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.localeCompare(b, 'id')
    })

    return results.slice(0, limit)
  }

  const getAllWords = () => [...INDONESIAN_WORDS]

  const isIndonesianWord = (word: string): boolean => {
    return INDONESIAN_WORDS.includes(word.toLowerCase().trim())
  }

  return {
    suggest,
    getAllWords,
    isIndonesianWord,
    wordCount: INDONESIAN_WORDS.length
  }
}
