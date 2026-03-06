const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'krishi.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS advisories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('disease', 'pest', 'management')),
    summary TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    cause TEXT NOT NULL,
    solution TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
  );

  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_name TEXT NOT NULL,
    crop_id INTEGER,
    question TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'answered')),
    submitted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed data if tables are empty
const cropCount = db.prepare('SELECT COUNT(*) as count FROM crops').get();

if (cropCount.count === 0) {
  const insertCrop = db.prepare('INSERT INTO crops (name, icon, description) VALUES (?, ?, ?)');
  const insertAdvisory = db.prepare(`
    INSERT INTO advisories (crop_id, title, type, summary, symptoms, cause, solution, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    // Insert crops
    const wheat = insertCrop.run('Wheat', '🌾', 'A cereal grain cultivated worldwide, major staple food crop grown in rabi season.');
    const rice = insertCrop.run('Rice', '🌾', 'A staple food for over half the world\'s population, grown in waterlogged paddy fields.');
    const tomato = insertCrop.run('Tomato', '🍅', 'A widely cultivated vegetable crop, susceptible to various diseases and pests.');

    const wheatId = wheat.lastInsertRowid;
    const riceId = rice.lastInsertRowid;
    const tomatoId = tomato.lastInsertRowid;

    // Wheat advisories
    insertAdvisory.run(
      wheatId, 'Wheat Rust (Yellow/Stripe Rust)', 'disease',
      'Yellow rust is one of the most devastating wheat diseases, capable of causing complete crop loss in severe cases.',
      'Yellow to orange stripes of powdery pustules on leaves; leaves turn pale and dry; stunted plant growth.',
      'Caused by the fungus Puccinia striiformis. Spreads via wind-borne spores. Favored by cool, moist weather (10–15°C).',
      'Apply Propiconazole 25 EC @ 0.1% or Mancozeb 75 WP @ 0.25%. Use resistant varieties like HD 2781, PBW 550. Avoid excessive nitrogen fertilization.',
      'high'
    );

    insertAdvisory.run(
      wheatId, 'Loose Smut of Wheat', 'disease',
      'A seed-borne disease that replaces wheat grain with black smutted masses, causing significant yield loss.',
      'Entire grain is replaced by black powdery mass. Infected spikes emerge early, appear dark and soot-like. Spores disperse during flowering.',
      'Caused by Ustilago tritici. The fungus infects the embryo of seeds during flowering and remains dormant until germination.',
      'Treat seeds with Carboxin + Thiram @ 2g/kg seed before sowing. Use certified disease-free seeds. Grow resistant varieties.',
      'medium'
    );

    insertAdvisory.run(
      wheatId, 'Aphid Infestation on Wheat', 'pest',
      'Aphids suck plant sap and can transmit viral diseases, significantly reducing grain quality and yield.',
      'Yellowing of leaves; sticky honeydew deposits; sooty mold growth; presence of tiny green/black insects in clusters on stems and leaves.',
      'Bird cherry-oat aphid (Rhopalosiphum padi) and English grain aphid. Thrive in warm, dry conditions.',
      'Spray Imidacloprid 17.8 SL @ 0.5 ml/L or Thiamethoxam 25 WG @ 0.3g/L. Encourage natural predators like ladybirds. Avoid excessive nitrogen.',
      'medium'
    );

    insertAdvisory.run(
      wheatId, 'Termite Damage in Wheat', 'pest',
      'Termites damage wheat roots and stems, causing sudden wilting and plant death, especially in dry sandy soils.',
      'Sudden wilting of plants (dead heart); uprooting of plants with damaged roots; presence of mud tubes near plant base.',
      'Odontotermes species attack roots and stems. More prevalent in light, sandy, dry soils with poor organic matter.',
      'Apply Chlorpyrifos 20 EC @ 4 L/ha in irrigation water. Treat soil with Chlorpyrifos dust at sowing. Avoid farm yard manure with termite colonies.',
      'high'
    );

    insertAdvisory.run(
      wheatId, 'Optimal Wheat Irrigation Management', 'management',
      'Proper irrigation scheduling is critical for maximizing wheat yield and water use efficiency.',
      'Not applicable — this is a management advisory.',
      'Wheat requires 4–6 irrigations depending on soil type and rainfall. Critical stages are: CRI, tillering, jointing, flowering, grain filling.',
      'Apply first irrigation (CRI) at 20–25 DAS. Subsequent irrigations at 40–45, 60–65, 80–85, 100–105 DAS. Use sprinkler irrigation to save 20–30% water.',
      'low'
    );

    // Rice advisories
    insertAdvisory.run(
      riceId, 'Rice Blast Disease', 'disease',
      'Rice blast is the most destructive fungal disease of rice, affecting all above-ground parts and causing severe yield losses.',
      'Diamond-shaped lesions with grey centers and brown borders on leaves; neck rot causing panicle breakage; white to grey discoloration of infected panicle.',
      'Caused by Magnaporthe oryzae. Spreads via wind-borne conidia. Favored by high humidity, frequent rainfall, and excessive nitrogen.',
      'Spray Tricyclazole 75 WP @ 0.6g/L or Isoprothiolane 40 EC @ 1.5 ml/L. Use blast-resistant varieties. Avoid excess nitrogen and close planting.',
      'high'
    );

    insertAdvisory.run(
      riceId, 'Bacterial Leaf Blight (BLB)', 'disease',
      'BLB is a major bacterial disease of rice causing significant yield loss under favorable conditions.',
      'Water-soaked lesions on leaf margins; lesions turn yellow to white and spread; milky bacterial ooze; leaves dry from tip downward.',
      'Caused by Xanthomonas oryzae pv. oryzae. Spreads through infected water, rain splashes, and mechanical damage. Favored by warm, humid conditions.',
      'Use resistant varieties (IR64, Swarna Sub1). Apply Copper Oxychloride 50 WP @ 3g/L. Avoid flood irrigation from infected fields. Maintain field sanitation.',
      'high'
    );

    insertAdvisory.run(
      riceId, 'Brown Planthopper (BPH)', 'pest',
      'BPH is the most destructive insect pest of rice, capable of causing complete crop failure through direct feeding and virus transmission.',
      'Yellowing and drying of plants in circular patches (hopper burn); plants lodge and wilt; presence of insects at base of plants; honeydew deposits.',
      'Nymphs and adults of Nilaparvata lugens. Thrives in dense planting, high nitrogen, and humid conditions. Can build up rapidly.',
      'Apply Imidacloprid 17.8 SL @ 0.25 ml/L or Buprofezin 25 SC @ 1 ml/L. Avoid synthetic pyrethroids that suppress natural enemies. Reduce plant density.',
      'high'
    );

    insertAdvisory.run(
      riceId, 'Stem Borer in Rice', 'pest',
      'Stem borers cause dead heart in vegetative stage and white ear/panicle in reproductive stage, causing significant yield loss.',
      'Dead tillers (dead heart) in vegetative stage; white unfilled panicles at reproductive stage; entry holes visible on stem; frass inside stem.',
      'Yellow stem borer (Scirpophaga incertulas) — larvae bore into stems. Attracted to dense, lush, nitrogen-rich crops.',
      'Apply Carbofuran 3G @ 33 kg/ha in standing water. Spray Chlorpyrifos 20 EC @ 2 ml/L. Clip and destroy egg masses. Use light traps to monitor adults.',
      'medium'
    );

    insertAdvisory.run(
      riceId, 'Paddy Water Management', 'management',
      'Efficient water management in paddy reduces water consumption while maintaining yields through alternate wetting and drying (AWD).',
      'Not applicable — this is a management advisory.',
      'Continuous flooding wastes water and can cause anaerobic soil conditions, nutrient imbalances, and increased methane emissions.',
      'Practice Alternate Wetting and Drying (AWD): allow water to drop 15 cm below soil surface before re-irrigation. Maintain shallow flooding during critical periods (flowering). Install piezometers to monitor water table.',
      'low'
    );

    // Tomato advisories
    insertAdvisory.run(
      tomatoId, 'Early Blight of Tomato', 'disease',
      'Early blight is a common fungal disease causing defoliation and significant reduction in tomato yield and fruit quality.',
      'Dark brown concentric rings (target-board pattern) on lower leaves; yellowing around lesions; premature leaf drop; stem cankers.',
      'Caused by Alternaria solani. Favored by warm, humid weather, and prolonged leaf wetness. Spreads via infected plant debris and splashing water.',
      'Apply Mancozeb 75 WP @ 2g/L or Chlorothalonil 75 WP @ 2g/L every 7–10 days. Remove and destroy infected leaves. Avoid overhead irrigation. Mulch soil to reduce splash.',
      'medium'
    );

    insertAdvisory.run(
      tomatoId, 'Tomato Leaf Curl Virus (ToLCV)', 'disease',
      'Tomato leaf curl virus is a devastating viral disease spread by whiteflies, causing severe yield loss and unmarketable fruits.',
      'Upward curling and cupping of leaves; leaf yellowing and thickening; stunted plant growth; flower and fruit drop; distorted fruits.',
      'Caused by Tomato leaf curl virus (begomovirus group). Transmitted persistently by whitefly (Bemisia tabaci). No cure once plant is infected.',
      'Use resistant varieties (Arka Rakshak, US-618). Control whitefly with Yellow sticky traps, Imidacloprid 17.8 SL @ 0.5 ml/L. Remove and destroy infected plants promptly.',
      'high'
    );

    insertAdvisory.run(
      tomatoId, 'Tomato Fruit Borer', 'pest',
      'Helicoverpa armigera is the most damaging pest of tomato, boring into fruits and rendering them unmarketable.',
      'Circular holes on green and ripening fruits; caterpillars inside fruits; frass around entry holes; premature fruit drop.',
      'Larvae of Helicoverpa armigera bore into fruits. Attracted to fruiting crops. Can develop resistance to insecticides rapidly.',
      'Apply Spinosad 45 SC @ 0.3 ml/L or Emamectin benzoate 5 SG @ 0.4g/L. Use pheromone traps (5/ha) to monitor. Collect and destroy damaged fruits. Install bird perches.',
      'high'
    );

    insertAdvisory.run(
      tomatoId, 'Whitefly Management in Tomato', 'pest',
      'Whiteflies cause direct damage by sucking plant sap and indirect damage by transmitting leaf curl virus.',
      'Tiny white flies on undersurface of leaves; yellowing and curling of leaves; honeydew and sooty mold; stunted plants.',
      'Bemisia tabaci — vector of Tomato leaf curl virus. Thrives in hot, dry weather. Reproduces rapidly in protected cultivation.',
      'Install yellow sticky traps @ 15–20/acre. Spray Spiromesifen 22.9 SC @ 0.9 ml/L or Neem oil @ 3 ml/L. Use reflective mulches. Maintain weed-free fields.',
      'medium'
    );

    insertAdvisory.run(
      tomatoId, 'Tomato Nutrition & Fertilization Guide', 'management',
      'Proper nutrient management ensures healthy plant growth, high yields, and good fruit quality in tomato cultivation.',
      'Not applicable — this is a management advisory.',
      'Tomatoes are heavy feeders with specific nutrient requirements at different growth stages. Imbalanced nutrition leads to disorders like blossom end rot and poor fruit set.',
      'Basal dose: FYM 20–25 t/ha + NPK 120:80:60 kg/ha. Top dressing: Urea 30 kg/ha at 30 and 60 days. Foliar spray of 0.5% Boron at flowering. Apply Calcium nitrate @ 5g/L to prevent blossom end rot.',
      'low'
    );
  });

  seedAll();
  console.log('Database seeded successfully.');
}

module.exports = db;
