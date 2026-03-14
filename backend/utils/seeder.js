require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Lab = require('../models/Lab');
const Experiment = require('../models/Experiment');
const Solution = require('../models/Solution');
const Equipment = require('../models/Equipment');

mongoose.connect(process.env.MONGO_URI).then(() => console.log('DB connected for seeding'));

const seed = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany(), Semester.deleteMany(), Subject.deleteMany(),
      Lab.deleteMany(), Experiment.deleteMany(), Solution.deleteMany(), Equipment.deleteMany(),
    ]);
    console.log('Cleared existing data');

    // ─── Users ────────────────────────────────────────────────────────────────
    const admin = await User.create({ name: 'Dr. Admin', email: 'admin@pharmalab.com', password: 'admin123', role: 'admin', phone: '9876543210' });
    const instructor1 = await User.create({ name: 'Prof. Ravi Kumar', email: 'ravi@pharmalab.com', password: 'instructor123', role: 'instructor', phone: '9876543211' });
    const instructor2 = await User.create({ name: 'Dr. Priya Sharma', email: 'priya@pharmalab.com', password: 'instructor123', role: 'instructor', phone: '9876543212' });
    const student1 = await User.create({ name: 'Ananya Patel', email: 'ananya@pharmalab.com', password: 'student123', role: 'student', rollNumber: 'BP2024001', semester: 1 });
    const student2 = await User.create({ name: 'Rohan Mehta', email: 'rohan@pharmalab.com', password: 'student123', role: 'student', rollNumber: 'BP2024002', semester: 1 });
    const student3 = await User.create({ name: 'Sneha Joshi', email: 'sneha@pharmalab.com', password: 'student123', role: 'student', rollNumber: 'BP2024003', semester: 2 });
    console.log('Users created');

    // ─── Semesters ────────────────────────────────────────────────────────────
    const sem1 = await Semester.create({ number: 1, name: 'Semester 1', year: 2024, description: 'Foundation semester covering basic pharmaceutical sciences', isActive: true });
    const sem2 = await Semester.create({ number: 2, name: 'Semester 2', year: 2024, description: 'Continuation of pharmaceutical chemistry and pharmacognosy' });
    const sem3 = await Semester.create({ number: 3, name: 'Semester 3', year: 2025, description: 'Pharmacology and pharmaceutical analysis' });
    const sem4 = await Semester.create({ number: 4, name: 'Semester 4', year: 2025, description: 'Formulation technology and quality control' });
    console.log('Semesters created');

    // ─── Subjects ─────────────────────────────────────────────────────────────
    const subPharmChem1 = await Subject.create({ name: 'Pharmaceutical Inorganic Chemistry', code: 'PIC101', semester: sem1._id, credits: 3, description: 'Study of inorganic pharmaceutical compounds' });
    const subPharmCog1  = await Subject.create({ name: 'Pharmacognosy-I', code: 'PCG101', semester: sem1._id, credits: 3, description: 'Identification and study of crude drugs' });
    const subPharmChem2 = await Subject.create({ name: 'Pharmaceutical Organic Chemistry', code: 'POC201', semester: sem2._id, credits: 3 });
    const subPharmAnal  = await Subject.create({ name: 'Pharmaceutical Analysis', code: 'PA301', semester: sem3._id, credits: 4 });

    await Semester.findByIdAndUpdate(sem1._id, { $push: { subjects: { $each: [subPharmChem1._id, subPharmCog1._id] } } });
    await Semester.findByIdAndUpdate(sem2._id, { $push: { subjects: subPharmChem2._id } });
    await Semester.findByIdAndUpdate(sem3._id, { $push: { subjects: subPharmAnal._id } });
    console.log('Subjects created');

    // ─── Labs ─────────────────────────────────────────────────────────────────
    const lab1 = await Lab.create({
      name: 'Inorganic Chemistry Lab', code: 'ICL-101', subject: subPharmChem1._id, semester: sem1._id,
      description: 'Laboratory for inorganic pharmaceutical chemistry practicals', location: 'Block A, Room 101',
      capacity: 30, instructors: [instructor1._id], isActive: true,
    });
    const lab2 = await Lab.create({
      name: 'Pharmacognosy Lab', code: 'PCG-101', subject: subPharmCog1._id, semester: sem1._id,
      description: 'Laboratory for plant drug identification and crude drug analysis', location: 'Block B, Room 201',
      capacity: 25, instructors: [instructor2._id], isActive: true,
    });
    const lab3 = await Lab.create({
      name: 'Pharmaceutical Analysis Lab', code: 'PAL-301', subject: subPharmAnal._id, semester: sem3._id,
      description: 'Advanced analytical techniques laboratory', location: 'Block C, Room 301',
      capacity: 20, instructors: [instructor1._id, instructor2._id], isActive: true,
    });

    await Subject.findByIdAndUpdate(subPharmChem1._id, { $push: { labs: lab1._id } });
    await Subject.findByIdAndUpdate(subPharmCog1._id,  { $push: { labs: lab2._id } });
    await Subject.findByIdAndUpdate(subPharmAnal._id,  { $push: { labs: lab3._id } });
    await User.findByIdAndUpdate(instructor1._id, { $push: { assignedLabs: { $each: [lab1._id, lab3._id] } } });
    await User.findByIdAndUpdate(instructor2._id, { $push: { assignedLabs: { $each: [lab2._id, lab3._id] } } });
    console.log('Labs created');

    // ─── Solutions ────────────────────────────────────────────────────────────
    const sol1 = await Solution.create({
      name: 'N/10 HCl Solution', formula: 'HCl', concentration: '0.1N',
      preparation: '8.5 mL of concentrated HCl is taken in a 1000 mL volumetric flask. Add 500 mL of distilled water and mix. Make up the volume to 1000 mL with distilled water. Standardize with 0.1N NaOH using methyl orange indicator.',
      chemicals: [{ name: 'Concentrated Hydrochloric Acid', quantity: '8.5', unit: 'mL' }, { name: 'Distilled Water', quantity: '1000', unit: 'mL' }],
      volume: '1000 mL', storageCondition: 'Store in amber glass bottle at room temperature',
      shelfLife: '6 months', hazardLevel: 'high',
      precautions: 'Wear gloves, goggles and lab coat. Handle in fume hood. Corrosive - avoid skin contact.',
      lab: lab1._id, createdBy: instructor1._id, stockAvailable: 500, unit: 'mL',
    });
    const sol2 = await Solution.create({
      name: 'N/10 NaOH Solution', formula: 'NaOH', concentration: '0.1N',
      preparation: 'Weigh 4.0 g of NaOH pellets and dissolve in 250 mL of freshly boiled and cooled distilled water. Transfer to a 1000 mL volumetric flask and make up the volume with distilled water.',
      chemicals: [{ name: 'Sodium Hydroxide Pellets', quantity: '4.0', unit: 'g' }, { name: 'Distilled Water', quantity: '1000', unit: 'mL' }],
      volume: '1000 mL', storageCondition: 'Store in tightly closed plastic bottle', shelfLife: '3 months',
      hazardLevel: 'medium', precautions: 'Highly caustic. Wear protective equipment.',
      lab: lab1._id, createdBy: instructor1._id, stockAvailable: 800, unit: 'mL',
    });
    const sol3 = await Solution.create({
      name: 'Fehling\'s Solution A', formula: 'CuSO4·5H2O',
      preparation: 'Dissolve 34.6 g of copper sulphate crystals in distilled water and make up to 500 mL.',
      chemicals: [{ name: 'Copper Sulphate (CuSO4·5H2O)', quantity: '34.6', unit: 'g' }, { name: 'Distilled Water', quantity: '500', unit: 'mL' }],
      volume: '500 mL', hazardLevel: 'low', lab: lab2._id, createdBy: instructor2._id, stockAvailable: 200, unit: 'mL',
    });
    const sol4 = await Solution.create({
      name: 'Mayer\'s Reagent (Potassium Mercuric Iodide)',
      preparation: 'Dissolve 1.36 g of mercuric chloride in 60 mL of water. Dissolve 5 g of potassium iodide in 10 mL of water. Mix both solutions and make up to 100 mL.',
      chemicals: [{ name: 'Mercuric Chloride', quantity: '1.36', unit: 'g' }, { name: 'Potassium Iodide', quantity: '5', unit: 'g' }, { name: 'Distilled Water', quantity: '100', unit: 'mL' }],
      volume: '100 mL', hazardLevel: 'high', precautions: 'HgCl2 is highly toxic. Handle with extreme caution in fume hood.',
      lab: lab2._id, createdBy: instructor2._id, stockAvailable: 100, unit: 'mL',
    });
    console.log('Solutions created');

    // ─── Experiments ──────────────────────────────────────────────────────────
    const exp1 = await Experiment.create({
      name: 'Determination of Percentage Purity of Ferrous Sulphate by Permanganometry',
      experimentNo: 'ICL-01', objective: 'To determine the percentage purity of ferrous sulphate by permanganometric titration.',
      theory: 'Permanganometry is a type of redox titration in which potassium permanganate (KMnO4) is used as the titrant. KMnO4 acts as a self-indicator due to its intense purple color. In acidic medium, KMnO4 oxidizes Fe2+ to Fe3+ and itself gets reduced to Mn2+ (colorless).',
      lab: lab1._id, subject: subPharmChem1._id, semester: sem1._id,
      requiredChemicals: [
        { name: 'Ferrous Sulphate', quantity: '1.0', unit: 'g' },
        { name: 'Sulphuric Acid (dilute)', quantity: '25', unit: 'mL' },
        { name: 'Potassium Permanganate Solution (0.1N)', quantity: 'Required', unit: 'mL' },
      ],
      solutions: [sol1._id],
      apparatus: [
        { name: 'Burette', quantity: '1', description: '50 mL' },
        { name: 'Conical Flask', quantity: '3', description: '250 mL' },
        { name: 'Pipette', quantity: '1', description: '25 mL' },
        { name: 'Weighing Balance', quantity: '1', description: 'Analytical' },
      ],
      procedure: `1. Accurately weigh about 1.0 g of the given sample of ferrous sulphate.
2. Transfer it to a 100 mL volumetric flask and dissolve in 25 mL of dilute sulphuric acid.
3. Make up the volume to 100 mL with distilled water and mix well.
4. Pipette out 25 mL of this solution into a 250 mL conical flask.
5. Add 25 mL of dilute H2SO4 to maintain the acidic medium.
6. Titrate with standard 0.1N KMnO4 solution until the pink color persists for 30 seconds.
7. Record the burette reading and repeat for concordant values.`,
      observations: 'Burette reading (Initial): ___mL, Final: ___mL, Volume of KMnO4 used: ___mL',
      result: '% Purity of FeSO4 = (V × N × Eq. wt × 100) / (Weight of sample × 1000)',
      precautions: 'Use dilute H2SO4 (not HCl or HNO3). KMnO4 is a strong oxidizing agent. Avoid contact with organic materials.',
      viva: [
        { question: 'Why is H2SO4 used in permanganometry instead of HCl?', answer: 'HCl can be oxidized by KMnO4 causing error in results. H2SO4 does not react with KMnO4.' },
        { question: 'What is the equivalent weight of KMnO4 in acidic medium?', answer: 'Eq. wt = Molecular weight / 5 = 158/5 = 31.6 g/eq' },
      ],
      category: 'Pharmaceutical Inorganic Chemistry', duration: 3, difficulty: 'medium',
      isApproved: true, approvedBy: admin._id, createdBy: instructor1._id,
      tags: ['titration', 'permanganometry', 'inorganic', 'purity'],
    });

    const exp2 = await Experiment.create({
      name: 'Identification of Alkaloids using Chemical Tests',
      experimentNo: 'PCG-01', objective: 'To identify alkaloids in a given crude drug sample using various chemical spot tests.',
      theory: 'Alkaloids are naturally occurring nitrogenous organic compounds that are basic in nature. They are found in many plants and are biologically active. Various precipitation reagents are used to identify alkaloids - Mayer\'s reagent gives cream precipitate, Dragendorff\'s gives orange precipitate, and Wagner\'s gives reddish-brown precipitate.',
      lab: lab2._id, subject: subPharmCog1._id, semester: sem1._id,
      requiredChemicals: [
        { name: 'Crude Drug Powder (e.g., Belladonna)', quantity: '2', unit: 'g' },
        { name: 'Dilute HCl', quantity: '10', unit: 'mL' },
        { name: 'Mayer\'s Reagent', quantity: 'Few drops', unit: '' },
        { name: 'Dragendorff\'s Reagent', quantity: 'Few drops', unit: '' },
        { name: 'Wagner\'s Reagent', quantity: 'Few drops', unit: '' },
      ],
      solutions: [sol3._id, sol4._id],
      apparatus: [
        { name: 'Test Tubes', quantity: '10', description: '' },
        { name: 'Beakers', quantity: '2', description: '50 mL' },
        { name: 'Filter Paper', quantity: '2', description: 'Whatman No. 1' },
        { name: 'Dropper', quantity: '5', description: '' },
      ],
      procedure: `1. Weigh 2 g of the powdered crude drug and extract with 20 mL of dilute HCl by heating on a water bath for 10 minutes.
2. Filter the extract and use for the following tests:
3. Mayer's Test: Add 2 drops of Mayer's reagent to 1 mL of acid extract - cream/white precipitate indicates alkaloids.
4. Dragendorff's Test: Add 2 drops of Dragendorff's reagent - orange/red precipitate indicates alkaloids.
5. Wagner's Test: Add 2 drops of Wagner's reagent - reddish-brown precipitate indicates alkaloids.
6. Hager's Test: Add 2 drops of Hager's reagent (picric acid) - yellow precipitate confirms alkaloids.
7. Record all observations in tabular form.`,
      observations: 'Mayer\'s Test: ___  Dragendorff\'s Test: ___  Wagner\'s Test: ___  Hager\'s Test: ___',
      result: 'The given crude drug __ alkaloids (is/is not inferred) based on positive/negative tests.',
      precautions: 'Mayer\'s reagent contains mercury - handle carefully. Dispose of mercury-containing waste properly.',
      category: 'Pharmacognosy', duration: 2, difficulty: 'easy',
      isApproved: true, approvedBy: admin._id, createdBy: instructor2._id,
      tags: ['alkaloids', 'pharmacognosy', 'plant drugs', 'chemical tests'],
    });

    const exp3 = await Experiment.create({
      name: 'Identification of Volatile Oils by Physical Constants',
      experimentNo: 'PCG-02', objective: 'To determine the physical constants (refractive index, specific gravity, optical rotation) of a given volatile oil.',
      theory: 'Volatile oils (essential oils) are complex mixtures of terpene hydrocarbons and their oxygenated derivatives. Their physical constants serve as standards for identification and quality assessment.',
      lab: lab2._id, subject: subPharmCog1._id, semester: sem1._id,
      requiredChemicals: [{ name: 'Given Volatile Oil Sample', quantity: '5', unit: 'mL' }],
      apparatus: [
        { name: 'Refractometer (Abbe)', quantity: '1', description: '' },
        { name: 'Specific Gravity Bottle', quantity: '1', description: '25 mL' },
        { name: 'Polarimeter', quantity: '1', description: '' },
        { name: 'Thermometer', quantity: '1', description: '0-100°C' },
      ],
      procedure: `1. Refractive Index: Calibrate the Abbe refractometer with distilled water at 20°C. Clean the prism and place 2-3 drops of oil. Read the refractive index. Take triplicate readings.
2. Specific Gravity: Weigh empty specific gravity bottle (W1). Fill with water and weigh (W2). Empty, fill with oil and weigh (W3). Sp. gravity = (W3-W1)/(W2-W1).
3. Optical Rotation: Fill the polarimeter tube with the oil. Observe angular rotation. Record as (+) for dextrorotatory and (-) for laevorotatory.`,
      observations: 'Refractive Index: ___ | Specific Gravity: ___ | Optical Rotation: ___°',
      result: 'The given volatile oil shows refractive index ___, specific gravity ___ and optical rotation ___.',
      category: 'Pharmacognosy', duration: 3, difficulty: 'medium',
      isApproved: true, approvedBy: admin._id, createdBy: instructor2._id,
      tags: ['volatile oils', 'physical constants', 'pharmacognosy'],
    });

    const exp4 = await Experiment.create({
      name: 'Complexometric Titration - Estimation of Calcium and Magnesium',
      experimentNo: 'ICL-02', objective: 'To determine the amount of calcium and magnesium in a given sample by complexometric titration using EDTA.',
      theory: 'Complexometric titrations involve the formation of coordinate covalent bonds between metal ions and a complexing agent (ligand). EDTA (Ethylene Diamine Tetra Acetic Acid) forms stable 1:1 complexes with most metal ions and is widely used.',
      lab: lab1._id, subject: subPharmChem1._id, semester: sem1._id,
      requiredChemicals: [
        { name: 'Sample Solution', quantity: '25', unit: 'mL' },
        { name: 'EDTA (0.01M)', quantity: 'As required', unit: 'mL' },
        { name: 'Buffer (pH 10)', quantity: '5', unit: 'mL' },
        { name: 'Eriochrome Black T (EBT) Indicator', quantity: 'A pinch', unit: '' },
      ],
      procedure: `1. Preparation of EDTA: Dissolve 3.72 g of disodium EDTA in 1 L distilled water to get 0.01M solution.
2. Estimation of total hardness: Pipette 25 mL sample into conical flask. Add 2 mL pH 10 buffer. Add pinch of EBT indicator (solution turns wine red). Titrate with EDTA until colour changes to blue. Note volume V1.
3. Estimation of Calcium: Add 2 mL of NaOH (4%) to 25 mL sample to precipitate Mg(OH)2. Add Murexide indicator. Titrate with EDTA (blue to pink end point). Note volume V2.
4. Magnesium = V1 - V2`,
      observations: 'Total Hardness titration V1 = ___ mL | Calcium titration V2 = ___ mL',
      result: 'Ca²⁺ = V2 × M × 40 × 1000/25 mg/L | Mg²⁺ = (V1-V2) × M × 24.3 × 1000/25 mg/L',
      category: 'Pharmaceutical Inorganic Chemistry', duration: 3, difficulty: 'medium',
      isApproved: true, approvedBy: admin._id, createdBy: instructor1._id,
      tags: ['EDTA', 'complexometry', 'calcium', 'magnesium', 'titration'],
    });

    // Link experiments to labs
    await Lab.findByIdAndUpdate(lab1._id, { $push: { experiments: { $each: [exp1._id, exp4._id] } } });
    await Lab.findByIdAndUpdate(lab2._id, { $push: { experiments: { $each: [exp2._id, exp3._id] } } });
    console.log('Experiments created');

    // ─── Equipment ────────────────────────────────────────────────────────────
    const equipmentList = [
      { name: 'Analytical Balance', category: 'instrument', lab: lab1._id, description: 'Electronic analytical balance 0.0001g readability', manufacturer: 'Sartorius', totalQuantity: 3, availableQuantity: 3, condition: 'good', location: 'Bench 1' },
      { name: 'Burette (50 mL)', category: 'glassware', lab: lab1._id, description: 'Class A borosilicate glass burette', totalQuantity: 15, availableQuantity: 15, condition: 'good', location: 'Cabinet A' },
      { name: 'Conical Flask (250 mL)', category: 'glassware', lab: lab1._id, description: 'Borosilicate glass Erlenmeyer flask', totalQuantity: 40, availableQuantity: 38, condition: 'good', location: 'Cabinet B' },
      { name: 'Volumetric Flask (100 mL)', category: 'glassware', lab: lab1._id, description: 'Class A volumetric flask', totalQuantity: 20, availableQuantity: 18, condition: 'good', location: 'Cabinet A' },
      { name: 'Pipette (25 mL)', category: 'glassware', lab: lab1._id, description: 'Class A graduated glass pipette', totalQuantity: 10, availableQuantity: 9, condition: 'good', location: 'Drawer 1' },
      { name: 'Hot Plate Magnetic Stirrer', category: 'instrument', lab: lab1._id, description: 'Combined hot plate and magnetic stirrer 100-1500 RPM', manufacturer: 'Remi', totalQuantity: 4, availableQuantity: 4, condition: 'good', location: 'Bench 2' },
      { name: 'Abbe Refractometer', category: 'instrument', lab: lab2._id, description: 'Precision Abbe refractometer for refractive index measurement', totalQuantity: 2, availableQuantity: 2, condition: 'good', location: 'Instrument Room' },
      { name: 'Polarimeter', category: 'instrument', lab: lab2._id, description: 'Digital automatic polarimeter', totalQuantity: 1, availableQuantity: 1, condition: 'fair', location: 'Instrument Room', notes: 'Calibration due in March 2026' },
      { name: 'Microscope (Compound)', category: 'instrument', lab: lab2._id, description: 'Binocular compound microscope 40x-1000x', manufacturer: 'Olympus', totalQuantity: 10, availableQuantity: 9, condition: 'good', location: 'Microscopy Room' },
      { name: 'UV-Visible Spectrophotometer', category: 'instrument', lab: lab3._id, description: 'Double beam UV-Vis spectrophotometer 200-800nm', manufacturer: 'Shimadzu', model: 'UV-1800', totalQuantity: 2, availableQuantity: 2, condition: 'good', location: 'Instrumental Lab' },
      { name: 'Safety Goggles', category: 'safety', lab: lab1._id, totalQuantity: 30, availableQuantity: 28, condition: 'good', location: 'Safety Cabinet' },
      { name: 'Nitrile Gloves (Box)', category: 'consumable', lab: lab1._id, totalQuantity: 5, availableQuantity: 2, condition: 'good', location: 'Storage', notes: 'Stock running low - reorder needed' },
    ];
    await Equipment.insertMany(equipmentList);
    console.log('Equipment created');

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LOGIN CREDENTIALS:');
    console.log('Admin:      admin@pharmalab.com     / admin123');
    console.log('Instructor: ravi@pharmalab.com      / instructor123');
    console.log('Instructor: priya@pharmalab.com     / instructor123');
    console.log('Student:    ananya@pharmalab.com    / student123');
    console.log('Student:    rohan@pharmalab.com     / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
