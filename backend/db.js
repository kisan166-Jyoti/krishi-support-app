const Database = require('better-sqlite3');
const path = require('path');

const dbFile = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, 'krishi.db');
const db = new Database(dbFile);

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

    // ── Maize ────────────────────────────────────────────────────────────────
    const maize = insertCrop.run('Maize', '🌽', 'A versatile cereal crop grown in kharif and rabi seasons, used for food, feed, and industrial purposes.');
    const maizeId = maize.lastInsertRowid;

    insertAdvisory.run(
      maizeId, 'Maize Downy Mildew', 'disease',
      'Downy mildew is the most destructive disease of maize in India, causing severe yield losses especially in young crops.',
      'Chlorotic stripes on leaves; white downy growth on leaf undersurface; stunted growth; excessive tillering (witch\'s broom); sterile plants.',
      'Caused by Peronosclerospora sorghi and P. heteropogoni. Spread through airborne oospores and infected seed. Favored by high humidity and moderate temperatures (25–30°C).',
      'Treat seeds with Metalaxyl 35 SD @ 6g/kg before sowing. Spray Metalaxyl + Mancozeb @ 2g/L at first sign. Remove and destroy infected plants. Use resistant hybrids like HQPM-1, DHM-117.',
      'high'
    );

    insertAdvisory.run(
      maizeId, 'Northern Corn Leaf Blight', 'disease',
      'NCLB causes large leaf lesions that reduce photosynthetic area, leading to significant yield reduction in susceptible hybrids.',
      'Long, elliptical, tan to grey-green cigar-shaped lesions (5–15 cm) on leaves; lesions turn brown with dark borders; premature leaf death.',
      'Caused by Exserohilum turcicum. Spreads via windborne conidia. Favored by cool, moist weather and extended leaf wetness.',
      'Spray Propiconazole 25 EC @ 1 ml/L or Mancozeb 75 WP @ 2.5g/L at early symptom stage. Grow resistant hybrids. Crop rotation with non-host crops. Avoid overhead irrigation.',
      'medium'
    );

    insertAdvisory.run(
      maizeId, 'Fall Armyworm', 'pest',
      'Fall Armyworm (FAW) is an invasive pest that can devastate maize crops, causing up to 100% yield loss if uncontrolled.',
      'Ragged feeding damage on leaves; presence of window-pane feeding; frass (sawdust-like excrement) in whorl; caterpillars with inverted Y-mark on head capsule.',
      'Spodoptera frugiperda — a migratory moth pest. Larvae feed aggressively in whorls and on cobs. Can complete life cycle in 30 days. Spreads rapidly.',
      'Apply Emamectin benzoate 5 SG @ 0.4g/L or Spinetoram 11.7 SC @ 0.5 ml/L into whorl. Use pheromone traps for monitoring. Apply sand + lime (9:1) into whorl at early infestation. Follow spray schedule with rotation of insecticides.',
      'high'
    );

    insertAdvisory.run(
      maizeId, 'Maize Stem Borer', 'pest',
      'Stem borers cause dead heart in young plants and broken tassels/cobs in older plants, significantly reducing grain yield.',
      'Dead heart in young plants; shot holes on leaves; entry holes on stem; frass deposits; broken tassels and incomplete grain filling.',
      'Chilo partellus (spotted stem borer) — larvae bore into stems at whorl stage. Favored by warm, humid conditions and dense planting.',
      'Release Trichogramma chilonis egg parasitoid @ 50,000/ha. Apply Carbofuran 3G granules @ 20 kg/ha in whorl at 15 and 30 DAS. Spray Chlorpyrifos 20 EC @ 2.5 ml/L. Collect and destroy egg masses.',
      'medium'
    );

    insertAdvisory.run(
      maizeId, 'Maize Fertilization & Plant Population Guide', 'management',
      'Optimum plant population combined with balanced nutrition is key to achieving high maize yield.',
      'Not applicable — this is a management advisory.',
      'Maize is a heavy feeder, especially for nitrogen. Improper plant density leads to lodging, poor pollination, and reduced yield.',
      'Recommended spacing: 60×20 cm (83,000 plants/ha). Basal: FYM 10 t/ha + NPK 120:60:40 kg/ha. Top dressing: Urea 60 kg/ha each at knee-high and tasseling. Apply Zinc sulphate @ 25 kg/ha if deficiency observed. Irrigate at knee-high, tasseling, and grain-filling stages.',
      'low'
    );

    // ── Onion ────────────────────────────────────────────────────────────────
    const onion = insertCrop.run('Onion', '🧅', 'An important bulb crop grown throughout India, prized for its culinary and medicinal uses.');
    const onionId = onion.lastInsertRowid;

    insertAdvisory.run(
      onionId, 'Purple Blotch of Onion', 'disease',
      'Purple blotch is the most common foliar disease of onion in India, causing premature drying of leaves and reduced bulb size.',
      'Small whitish sunken lesions with purple centers on leaves and scapes; lesions enlarge with yellow margins; severe defoliation; stalk collapse.',
      'Caused by Alternaria porri. Spreads via wind-borne conidia. Favored by warm temperatures (25–30°C), high humidity, and dew. Secondary infection by Stemphylium vesicarium common.',
      'Spray Mancozeb 75 WP @ 2.5g/L or Iprodione 50 WP @ 2g/L every 7–10 days from 30 DAS. Add sticker agent. Avoid waterlogging. Remove infected crop debris. Use resistant varieties like Agrifound Light Red.',
      'medium'
    );

    insertAdvisory.run(
      onionId, 'Basal Rot (Fusarium Rot)', 'disease',
      'Basal rot causes rotting of the bulb base and root system, leading to plant collapse and significant storage losses.',
      'Yellowing and tip dieback of leaves; wilting of plants; pink to red rot at bulb base; white mycelial growth on roots; foul smell from infected bulbs.',
      'Caused by Fusarium oxysporum f.sp. cepae. Soil-borne pathogen that enters through roots and wounds. Favored by warm soils, waterlogging, and root damage by pests.',
      'Treat seeds/sets with Carbendazim + Thiram @ 2g/kg. Drench soil with Carbendazim 50 WP @ 1g/L. Avoid waterlogging. Practice 3-year crop rotation. Remove and destroy infected plants immediately.',
      'high'
    );

    insertAdvisory.run(
      onionId, 'Onion Thrips', 'pest',
      'Thrips are the most damaging pest of onion, causing silvering of leaves and also transmitting Iris Yellow Spot Virus.',
      'Silvery-white streaks and blotches on leaves; leaf tips turn pale and curl; stunted plants; white papery patches on leaves; tiny yellowish insects visible in leaf folds.',
      'Thrips tabaci — feeds by rasping and sucking leaf tissue. Thrives in hot, dry weather. Populations build rapidly during dry spells.',
      'Spray Spinosad 45 SC @ 0.3 ml/L or Fipronil 5 SC @ 1.5 ml/L. Maintain field hygiene. Use blue sticky traps for monitoring. Avoid water stress. Spray in early morning or evening for better efficacy.',
      'high'
    );

    insertAdvisory.run(
      onionId, 'Onion Maggot', 'pest',
      'Onion maggot larvae tunnel into bulbs and seedlings, causing wilting, rotting, and complete stand loss in severe cases.',
      'Wilting and yellowing of young seedlings; tunneling and rotting in bulbs; soft, watery bulb decay; presence of small cream-white maggots inside bulbs.',
      'Delia antiqua (Diptera: Anthomyiidae) — fly lays eggs near plant base; larvae bore into roots and bulbs. Worse in cool, moist soils and high organic matter fields.',
      'Treat transplants by dipping roots in Chlorpyrifos 20 EC @ 2 ml/L solution before planting. Apply Phorate 10G @ 10 kg/ha in soil at planting. Use row covers early in season. Destroy crop residues after harvest.',
      'medium'
    );

    insertAdvisory.run(
      onionId, 'Onion Bulb Development & Irrigation Management', 'management',
      'Proper irrigation and stoppage at the right time determines bulb size, quality, and shelf life.',
      'Not applicable — this is a management advisory.',
      'Overwatering near maturity causes soft bulbs and poor storage. Insufficient water reduces bulb size significantly.',
      'Irrigate at 7–10 day intervals during vegetative stage. Increase to 5–7 days during bulb development. Stop irrigation 10–15 days before harvest when 50% of tops have fallen. Avoid water stress at bulb initiation. Harvest in dry weather and cure bulbs in shade for 7–10 days before storage.',
      'low'
    );

    // ── Sugarcane ────────────────────────────────────────────────────────────
    const sugarcane = insertCrop.run('Sugarcane', '🎋', 'A tall perennial grass grown extensively in tropical India for sugar production, the backbone of the sugar industry.');
    const sugarcaneId = sugarcane.lastInsertRowid;

    insertAdvisory.run(
      sugarcaneId, 'Red Rot of Sugarcane', 'disease',
      'Red rot is the most serious disease of sugarcane in India, killing plants rapidly and causing massive yield and quality losses.',
      'Sudden wilting and drying of top leaves; reddish discoloration of internal stalk tissue with white patches across it; fermenting/sour smell; shredded internal tissue.',
      'Caused by Colletotrichum falcatum. Spreads through infected setts, waterlogged conditions, and borers that create entry wounds. Favored by warm, humid weather.',
      'Use disease-free seed setts from resistant varieties (Co 0238, CoLk 94184). Treat setts with Carbendazim 50 WP @ 1g/L for 15 minutes. Rogue out infected clumps immediately. Avoid waterlogging. Do not ratoon infected fields.',
      'high'
    );

    insertAdvisory.run(
      sugarcaneId, 'Sugarcane Smut', 'disease',
      'Smut reduces cane yield by replacing the growing point with a whip-like black spore mass, making the crop completely unproductive.',
      'Slender whip-like black structure (smut whip) emerging from growing point; infected shoots are thin and grassy with narrow leaves; reduced tillering and cane girth.',
      'Caused by Sporisorium scitamineum. Wind-borne teliospores infect buds during germination. Disease systemic — spreads throughout the plant. Worse in dry soils and with stressed crops.',
      'Plant only smut-free certified setts. Treat setts with hot water @ 52°C for 30 minutes. Use resistant varieties (Co 86032, CoJ 64). Rogue out smutted clumps before whips burst. Avoid ratooning infected fields.',
      'medium'
    );

    insertAdvisory.run(
      sugarcaneId, 'Early Shoot Borer', 'pest',
      'Early shoot borer causes dead heart in young crop, significantly reducing plant population and ultimately cane yield.',
      'Dead heart (central shoot dies while outer leaves remain green); exit holes at base of dead shoot; presence of caterpillars inside stem; foul smell from dead shoots.',
      'Chilo infuscatellus — first generation larvae bore into shoots at ground level. Peak damage at 1–3 months after planting. Severe in hot, dry weather.',
      'Release Trichogramma chilonis @ 50,000/ha at 30 and 45 DAS. Apply Chlorpyrifos 20 EC @ 2.5 ml/L in leaf whorls. Drench base of plants with Carbofuran 3G @ 33 kg/ha. Remove and destroy dead hearts. Maintain soil moisture to reduce borer activity.',
      'high'
    );

    insertAdvisory.run(
      sugarcaneId, 'Woolly Aphid', 'pest',
      'Woolly aphid is an invasive pest that colonizes sugarcane leaves and reduces photosynthesis, causing significant yield reduction.',
      'White woolly masses on undersurface of leaves; yellowing and curling of leaves; sooty mold on honeydew deposits; stunted growth; presence of ants tending aphid colonies.',
      'Ceratovacuna lanigera — forms dense colonies covered in white waxy filaments. Spreads rapidly in dry, warm weather. Ants protect colonies from natural enemies.',
      'Spray Dimethoate 30 EC @ 1.5 ml/L or Imidacloprid 17.8 SL @ 0.5 ml/L on the undersurface of leaves. Avoid broad-spectrum insecticides that kill natural enemies. Remove ant colonies. Conserve predators like Dipha aphidivora.',
      'medium'
    );

    insertAdvisory.run(
      sugarcaneId, 'Sugarcane Ratoon Crop Management', 'management',
      'Proper ratoon management can produce 80–90% of plant crop yield at significantly lower cost, improving overall profitability.',
      'Not applicable — this is a management advisory.',
      'Poor ratoon management leads to declining yields over successive ratoons due to poor stubble sprouting, pest carry-over, and nutrient depletion.',
      'Harvest at ground level to promote good sprouting. Gap-fill within 30 days. Apply 100% extra nitrogen (180 kg/ha vs 120 kg/ha for plant crop). Apply Trash mulching to conserve moisture. Propped up irrigation immediately after harvest. Trench and trash mulch for moisture retention. Retain only 2–3 ratoons for economic viability.',
      'low'
    );

    // ── Soybean ──────────────────────────────────────────────────────────────
    const soybean = insertCrop.run('Soybean', '🫘', 'A leguminous oilseed crop rich in protein and oil, widely grown in central India during the kharif season.');
    const soybeanId = soybean.lastInsertRowid;

    insertAdvisory.run(
      soybeanId, 'Soybean Rust', 'disease',
      'Asian soybean rust is a highly destructive foliar disease that can cause complete defoliation and severe yield losses if not controlled early.',
      'Small tan to dark brown lesions on lower leaf surface; powdery pustules (uredinia) on underside of leaves; premature defoliation starting from lower canopy; reduced pod filling.',
      'Caused by Phakopsora pachyrhizi. Spreads rapidly by wind-borne urediniospores. Favored by temperatures of 15–25°C and prolonged leaf wetness (>6 hours). Completes cycle in 9–12 days.',
      'Spray Tebuconazole 25 EC @ 1 ml/L or Hexaconazole 5 SC @ 1 ml/L at first sign of disease. Repeat every 14 days. Sow early to avoid peak rust season. Use partially resistant varieties like JS 335, MACS 450.',
      'high'
    );

    insertAdvisory.run(
      soybeanId, 'Yellow Mosaic Virus (YMV)', 'disease',
      'Yellow mosaic virus transmitted by whitefly causes bright yellow patches on leaves and severely reduces grain yield and quality.',
      'Bright yellow patches intermixed with green areas on young leaves; mosaic and mottling pattern; stunted growth; reduced pod set; shrivelled seeds.',
      'Caused by Mungbean Yellow Mosaic Virus (MYMV) transmitted persistently by whitefly (Bemisia tabaci). Spreads rapidly in dry weather with high whitefly populations.',
      'Use resistant varieties (JS 335, Pusa 9712). Control whitefly with Imidacloprid 17.8 SL @ 0.5 ml/L as seed treatment and foliar spray. Remove and destroy infected plants early. Sow on time — avoid late sowing. Use yellow sticky traps to monitor whitefly.',
      'high'
    );

    insertAdvisory.run(
      soybeanId, 'Stem Fly', 'pest',
      'Stem fly is the most serious pest of soybean in India at seedling stage, causing high plant mortality and poor crop establishment.',
      'Wilting and death of young seedlings (dead heart); minute white maggots tunneling inside stems near soil level; internal stem browning; reduced plant stand.',
      'Melanagromyza sojae — fly lays eggs in leaf tissue; larvae mine down to stem and feed internally. Worst during early crop growth (10–25 DAS). Favored by warm weather and late sowing.',
      'Treat seeds with Imidacloprid 70 WS @ 7.5 ml/kg or Thiamethoxam 70 WS @ 3g/kg before sowing. Spray Dimethoate 30 EC @ 2 ml/L at 10 and 20 DAS. Sow on time. Avoid water stress in early growth stage.',
      'medium'
    );

    insertAdvisory.run(
      soybeanId, 'Girdle Beetle', 'pest',
      'Girdle beetle severs the stem causing wilting of shoot tips and significant plant loss especially in rainfed soybean.',
      'Sudden wilting of shoot tips; circular girdles (cuts) on stems at 1–2 positions; hanging or broken stem above girdle; larvae tunneling inside stems.',
      'Oberea brevis — adult beetle cuts circular grooves in stem and lays eggs inside. Larvae feed on stem pith. Worst during July–August in rainfed crops.',
      'Spray Endosulfan 35 EC @ 1.5 ml/L or Profenofos 50 EC @ 2 ml/L when adult beetles are seen (early morning monitoring). Collect and destroy wilted shoots. Avoid water stress. Maintain plant population with gap-filling.',
      'high'
    );

    insertAdvisory.run(
      soybeanId, 'Soybean Weed & Intercrop Management', 'management',
      'Timely weed control and intercropping with sorghum improves soybean profitability and suppresses pest pressure.',
      'Not applicable — this is a management advisory.',
      'Soybean is highly sensitive to weed competition in the first 30–40 days. Weeds can reduce yield by 40–60%. Monoculture increases pest and disease risk.',
      'Apply pre-emergence Pendimethalin 30 EC @ 3.3 L/ha within 3 days of sowing. Follow with one hand weeding at 20–25 DAS. Intercrop soybean with sorghum (4:2 row ratio) to suppress pests and improve income. Inoculate seeds with Rhizobium + PSB culture @ 5g/kg seed to fix atmospheric nitrogen.',
      'low'
    );
  });

  seedAll();
  console.log('Database seeded successfully.');
}

module.exports = db;
