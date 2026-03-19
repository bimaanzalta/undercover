import { getDb } from '../utils/db'

export default defineNitroPlugin(async () => {
  console.log('[Migration] Running database migrations...')

  const db = getDb()

  try {
    // Create rooms table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(8) PRIMARY KEY,
        host_name VARCHAR(50) NOT NULL,
        status ENUM('lobby','playing','finished') DEFAULT 'lobby',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create players table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(8) NOT NULL,
        name VARCHAR(50) NOT NULL,
        role ENUM('civilian','undercover','mrwhite') NULL,
        word VARCHAR(100) NULL,
        is_eliminated TINYINT(1) DEFAULT 0,
        session_id VARCHAR(100) NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )
    `)

    // Create games table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(8) NOT NULL,
        round_num INT DEFAULT 1,
        phase ENUM('clue','voting','result','finished') DEFAULT 'clue',
        civilian_word VARCHAR(100),
        undercover_word VARCHAR(100),
        clues_submitted INT DEFAULT 0,
        votes_submitted INT DEFAULT 0,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )
    `)

    // Create clues table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        player_id INT NOT NULL,
        round_num INT NOT NULL,
        clue_text VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create votes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        round_num INT NOT NULL,
        voter_id INT NOT NULL,
        target_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create word_pairs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS word_pairs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        civilian_word VARCHAR(100) NOT NULL,
        undercover_word VARCHAR(100) NOT NULL
      )
    `)

    // Insert word pairs if not exists
    const [existingPairs] = await db.execute('SELECT COUNT(*) as count FROM word_pairs') as any
    if (existingPairs[0].count === 0) {
      await db.execute(`
        INSERT INTO word_pairs (civilian_word, undercover_word) VALUES
        ('Kucing', 'Harimau'),
        ('Apel', 'Pir'),
        ('Pizza', 'Roti'),
        ('Pantai', 'Kolam Renang'),
        ('Motor', 'Sepeda'),
        ('Dokter', 'Perawat'),
        ('Gitar', 'Ukulele'),
        ('Nasi Goreng', 'Nasi Putih'),
        ('Singa', 'Cheetah'),
        ('Buku', 'Majalah'),
        ('Handphone', 'Tablet'),
        ('Sepatu', 'Sandal'),
        ('Teh', 'Kopi'),
        ('Matahari', 'Bulan'),
        ('Hujan', 'Salju'),
        ('Pasar', 'Mall'),
        ('Polisi', 'Tentara'),
        ('Penjara', 'Sekolah'),
        ('Tidur', 'Pingsan'),
        ('Tertawa', 'Tersenyum'),
        ('Bola', 'Balon'),
        ('Ular', 'Cacing'),
        ('Pesawat', 'Roket'),
        ('Kapal', 'Perahu'),
        ('Rumah', 'Apartemen'),
        ('Kebun', 'Hutan'),
        ('Api', 'Lilin'),
        ('Es Krim', 'Yogurt'),
        ('Coklat', 'Permen'),
        ('Celana', 'Rok'),
        ('Nasi', 'Bubur'),
        ('Mie', 'Bihun'),
        ('Ayam', 'Bebek'),
        ('Sapi', 'Kerbau'),
        ('Kambing', 'Domba'),
        ('Ikan', 'Udang'),
        ('Mangga', 'Pepaya'),
        ('Pisang', 'Singkong'),
        ('Jeruk', 'Lemon'),
        ('Semangka', 'Melon'),
        ('Wortel', 'Lobak'),
        ('Bayam', 'Kangkung'),
        ('Tomat', 'Cabai'),
        ('Bawang', 'Jahe'),
        ('Gula', 'Garam'),
        ('Kecap', 'Saus'),
        ('Susu', 'Yogurt'),
        ('Keju', 'Mentega'),
        ('Telur', 'Tahu'),
        ('Tempe', 'Oncom')
      `)
      console.log('[Migration] Word pairs inserted successfully')
    }

    console.log('[Migration] All migrations completed successfully')
  } catch (error) {
    console.error('[Migration] Migration failed:', error)
    // Don't throw - let the app start even if migration fails
  }
})
