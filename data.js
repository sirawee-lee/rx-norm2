// Sample NHI drug data (25 common drugs)
// In production: load from /public/nhi_data.csv via papaparse
export const DRUGS = [
  { id:'A024806100', nameEN:'Magnesium Oxide 250mg Tablet', nameZH:'氧化鎂錠250毫克', ingredient:'Magnesium Oxide', atc:'A02AA02', form:'Tablet', strength:'250mg', price:'1.00', manufacturer:'信東生技' },
  { id:'A041374100', nameEN:'Acetaminophen 500mg Tablet', nameZH:'乙醯胺酚錠500毫克', ingredient:'Acetaminophen', atc:'N02BE01', form:'Tablet', strength:'500mg', price:'1.30', manufacturer:'永信藥品' },
  { id:'B032811100', nameEN:'Metformin HCl 500mg Tablet', nameZH:'鹽酸二甲雙胍錠500毫克', ingredient:'Metformin', atc:'A10BA02', form:'Tablet', strength:'500mg', price:'2.10', manufacturer:'健亞生技' },
  { id:'C018443100', nameEN:'Amlodipine Besylate 5mg Tablet', nameZH:'苯磺酸氨氯地平錠5毫克', ingredient:'Amlodipine', atc:'C08CA01', form:'Tablet', strength:'5mg', price:'4.80', manufacturer:'輝瑞' },
  { id:'D029112100', nameEN:'Atorvastatin Calcium 10mg Tablet', nameZH:'阿托伐他汀鈣錠10毫克', ingredient:'Atorvastatin', atc:'C10AA05', form:'Tablet', strength:'10mg', price:'12.50', manufacturer:'輝瑞' },
  { id:'E044721100', nameEN:'Lisinopril 10mg Tablet', nameZH:'賴諾普利錠10毫克', ingredient:'Lisinopril', atc:'C09AA03', form:'Tablet', strength:'10mg', price:'5.60', manufacturer:'台灣默克' },
  { id:'F031092100', nameEN:'Warfarin Sodium 5mg Tablet', nameZH:'可邁丁錠5毫克', ingredient:'Warfarin', atc:'B01AA03', form:'Tablet', strength:'5mg', price:'3.20', manufacturer:'百特' },
  { id:'G022341100', nameEN:'Omeprazole 20mg Capsule', nameZH:'奧美拉唑膠囊20毫克', ingredient:'Omeprazole', atc:'A02BC01', form:'Capsule', strength:'20mg', price:'8.90', manufacturer:'阿斯特捷利康' },
  { id:'H019832100', nameEN:'Amoxicillin 500mg Capsule', nameZH:'阿莫西林膠囊500毫克', ingredient:'Amoxicillin', atc:'J01CA04', form:'Capsule', strength:'500mg', price:'3.50', manufacturer:'葛蘭素史克' },
  { id:'I028741100', nameEN:'Ibuprofen 400mg Tablet', nameZH:'布洛芬錠400毫克', ingredient:'Ibuprofen', atc:'M01AE01', form:'Tablet', strength:'400mg', price:'2.20', manufacturer:'台灣諾華' },
  { id:'J031234100', nameEN:'Aspirin 100mg Tablet', nameZH:'阿斯匹靈腸溶錠100毫克', ingredient:'Aspirin', atc:'B01AC06', form:'Tablet', strength:'100mg', price:'1.80', manufacturer:'拜耳' },
  { id:'K019283100', nameEN:'Simvastatin 20mg Tablet', nameZH:'辛伐他汀錠20毫克', ingredient:'Simvastatin', atc:'C10AA01', form:'Tablet', strength:'20mg', price:'6.70', manufacturer:'默克' },
  { id:'L024891100', nameEN:'Losartan Potassium 50mg Tablet', nameZH:'鉀鹽氯沙坦錠50毫克', ingredient:'Losartan', atc:'C09CA01', form:'Tablet', strength:'50mg', price:'7.30', manufacturer:'默克' },
  { id:'M031872100', nameEN:'Metoprolol Tartrate 50mg Tablet', nameZH:'酒石酸美托洛爾錠50毫克', ingredient:'Metoprolol', atc:'C07AB02', form:'Tablet', strength:'50mg', price:'4.10', manufacturer:'諾華' },
  { id:'N028341100', nameEN:'Furosemide 40mg Tablet', nameZH:'呋塞米錠40毫克', ingredient:'Furosemide', atc:'C03CA01', form:'Tablet', strength:'40mg', price:'2.80', manufacturer:'賽諾菲' },
  { id:'O019234100', nameEN:'Insulin Glargine 100IU/mL Injection', nameZH:'甘精胰島素注射液100IU/毫升', ingredient:'Insulin Glargine', atc:'A10AE04', form:'Injection', strength:'100IU/mL', price:'289.00', manufacturer:'賽諾菲' },
  { id:'P031823100', nameEN:'Cetirizine HCl 10mg Tablet', nameZH:'鹽酸西替利嗪錠10毫克', ingredient:'Cetirizine', atc:'R06AE07', form:'Tablet', strength:'10mg', price:'3.90', manufacturer:'UCB' },
  { id:'Q028492100', nameEN:'Ciprofloxacin 500mg Tablet', nameZH:'環丙沙星錠500毫克', ingredient:'Ciprofloxacin', atc:'J01MA02', form:'Tablet', strength:'500mg', price:'9.20', manufacturer:'拜耳' },
  { id:'R019283100', nameEN:'Prednisolone 5mg Tablet', nameZH:'潑尼松龍錠5毫克', ingredient:'Prednisolone', atc:'H02AB06', form:'Tablet', strength:'5mg', price:'2.60', manufacturer:'台灣默克' },
  { id:'S028341100', nameEN:'Diazepam 5mg Tablet', nameZH:'地西泮錠5毫克', ingredient:'Diazepam', atc:'N05BA01', form:'Tablet', strength:'5mg', price:'1.90', manufacturer:'羅氏' },
  { id:'T031234100', nameEN:'Levothyroxine 50mcg Tablet', nameZH:'左甲狀腺素錠50微克', ingredient:'Levothyroxine', atc:'H03AA01', form:'Tablet', strength:'50mcg', price:'3.40', manufacturer:'雅培' },
  { id:'U019283100', nameEN:'Vitamin D3 1000IU Capsule', nameZH:'維他命D3膠囊1000IU', ingredient:'Cholecalciferol', atc:'A11CC05', form:'Capsule', strength:'1000IU', price:'4.20', manufacturer:'台灣武田' },
  { id:'V028341100', nameEN:'Calcium Carbonate 500mg Tablet', nameZH:'碳酸鈣錠500毫克', ingredient:'Calcium Carbonate', atc:'A12AA04', form:'Tablet', strength:'500mg', price:'1.50', manufacturer:'信東生技' },
  { id:'W031234100', nameEN:'Escitalopram 10mg Tablet', nameZH:'草酸艾司西酞普蘭錠10毫克', ingredient:'Escitalopram', atc:'N06AB10', form:'Tablet', strength:'10mg', price:'18.50', manufacturer:'靈北' },
  { id:'X019283100', nameEN:'Allopurinol 100mg Tablet', nameZH:'別嘌醇錠100毫克', ingredient:'Allopurinol', atc:'M04AA01', form:'Tablet', strength:'100mg', price:'2.10', manufacturer:'台灣葛蘭素' },
]

// Fuzzy search: returns scored results
export function searchDrugs(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase().trim()
  return DRUGS
    .map(d => {
      const fields = [d.nameEN, d.nameZH, d.ingredient, d.id, d.atc].join(' ').toLowerCase()
      let score = 0
      if (fields.includes(q)) score = q.length === fields.length ? 1.0 : 0.85
      else if (fields.split(' ').some(w => w.startsWith(q))) score = 0.70
      else if (fields.includes(q.slice(0, Math.max(3, q.length - 1)))) score = 0.50
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

// Simulate OCR result from a prescription
export const DEMO_OCR_RESULT = {
  rawText: 'MAGNESIUM OXIDE 250mg\n氧化鎂錠\nOMEPRAZOLE 20mg\n奧美拉唑膠囊\nACETAMINOPHEN 500mg',
  matched: [
    { drug: DRUGS[0], confidence: 0.96 },
    { drug: DRUGS[7], confidence: 0.91 },
    { drug: DRUGS[1], confidence: 0.88 },
  ]
}
