import { useState, useEffect, useRef, useCallback } from "react";

// ============ STORAGE HELPERS ============
const STORAGE_KEYS = {
  PROFILE: "pkh-profile",
  HISTORY: "pkh-history",
  CUSTOM_FOODS: "pkh-custom-foods",
  TODAY: "pkh-today",
};

async function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
async function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Save error:", e); }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ============ FOOD DATABASE ============
const FOOD_DATA = [
  // Dal & Pulses
  { id:"chana", name:"Chana", nameHi:"छोले", emoji:"🫘", protein:15, serving:"1 bowl (150g)", category:"dal", veg:true },
  { id:"rajma", name:"Rajma", nameHi:"राजमा", emoji:"🫘", protein:13, serving:"1 bowl (150g)", category:"dal", veg:true },
  { id:"moong_dal", name:"Moong Dal", nameHi:"मूंग दाल", emoji:"🥣", protein:12, serving:"1 bowl", category:"dal", veg:true },
  { id:"toor_dal", name:"Toor Dal", nameHi:"तूर दाल", emoji:"🥣", protein:10, serving:"1 bowl", category:"dal", veg:true },
  { id:"masoor_dal", name:"Masoor Dal", nameHi:"मसूर दाल", emoji:"🥣", protein:9, serving:"1 bowl", category:"dal", veg:true },
  { id:"urad_dal", name:"Urad Dal", nameHi:"उड़द दाल", emoji:"🥣", protein:12, serving:"1 bowl", category:"dal", veg:true },
  { id:"chana_dal", name:"Chana Dal", nameHi:"चना दाल", emoji:"🥣", protein:11, serving:"1 bowl", category:"dal", veg:true },
  { id:"sprouts", name:"Sprouts", nameHi:"अंकुरित", emoji:"🌱", protein:13, serving:"1 bowl", category:"dal", veg:true },
  { id:"lobia", name:"Lobia", nameHi:"लोबिया", emoji:"🫘", protein:11, serving:"1 bowl", category:"dal", veg:true },
  { id:"dal_makhani", name:"Dal Makhani", nameHi:"दाल मखनी", emoji:"🥣", protein:12, serving:"1 bowl", category:"dal", veg:true },

  // Dairy
  { id:"paneer", name:"Paneer", nameHi:"पनीर", emoji:"🧀", protein:14, serving:"100g", category:"dairy", veg:true },
  { id:"dahi", name:"Dahi / Curd", nameHi:"दही", emoji:"🥛", protein:8, serving:"1 bowl (200g)", category:"dairy", veg:true },
  { id:"milk", name:"Milk", nameHi:"दूध", emoji:"🥛", protein:7, serving:"1 glass (250ml)", category:"dairy", veg:true },
  { id:"chaach", name:"Chaach", nameHi:"छाछ", emoji:"🥛", protein:5, serving:"1 glass", category:"dairy", veg:true },
  { id:"lassi", name:"Lassi", nameHi:"लस्सी", emoji:"🥤", protein:8, serving:"1 glass", category:"dairy", veg:true },
  { id:"hung_curd", name:"Hung Curd", nameHi:"हंग कर्ड", emoji:"🍶", protein:10, serving:"1 bowl", category:"dairy", veg:true },
  { id:"cheese", name:"Cheese Slice", nameHi:"चीज़", emoji:"🧀", protein:5, serving:"1 slice (20g)", category:"dairy", veg:true },
  { id:"paneer_bhurji", name:"Paneer Bhurji", nameHi:"पनीर भुर्जी", emoji:"🍳", protein:18, serving:"1 plate", category:"dairy", veg:true },

  // Branded
  { id:"amul_pro_milk", name:"Amul Protein Milk", nameHi:"अमूल प्रोटीन", emoji:"🥛", protein:20, serving:"250ml", category:"brand", veg:true },
  { id:"amul_protein_lassi", name:"Amul Protein Lassi", nameHi:"अमूल लस्सी", emoji:"🥤", protein:20, serving:"250ml", category:"brand", veg:true },
  { id:"amul_protein_shake", name:"Amul Protein Shake", nameHi:"अमूल शेक", emoji:"🥤", protein:20, serving:"200ml", category:"brand", veg:true },
  { id:"amul_greek_yogurt", name:"Amul Greek Yogurt", nameHi:"अमूल ग्रीक", emoji:"🍶", protein:14, serving:"125g", category:"brand", veg:true },
  { id:"epigamia_protein_yog", name:"Epigamia Protein Yogurt", nameHi:"एपिगेमिया", emoji:"🍶", protein:15, serving:"120g", category:"brand", veg:true },
  { id:"epigamia_protein_milk", name:"Epigamia Protein Milk", nameHi:"एपिगेमिया दूध", emoji:"🥛", protein:20, serving:"250ml", category:"brand", veg:true },
  { id:"protinex", name:"Protinex (mixed)", nameHi:"प्रोटीनेक्स", emoji:"🥤", protein:17, serving:"2 scoops+milk", category:"brand", veg:true },
  { id:"yoga_bar_protein", name:"Yoga Bar Protein Bar", nameHi:"योगा बार", emoji:"🍫", protein:20, serving:"1 bar (60g)", category:"brand", veg:true },
  { id:"ritebite_bar", name:"RiteBite Max Protein", nameHi:"राइटबाइट", emoji:"🍫", protein:20, serving:"1 bar (70g)", category:"brand", veg:true },
  { id:"true_elements_muesli", name:"True Elements Muesli", nameHi:"ट्रू एलीमेंट्स", emoji:"🥣", protein:15, serving:"50g", category:"brand", veg:true },
  { id:"mother_dairy_protein", name:"Mother Dairy Shake", nameHi:"मदर डेयरी", emoji:"🥛", protein:18, serving:"250ml", category:"brand", veg:true },
  { id:"go_protein", name:"Go Protein Milkshake", nameHi:"गो प्रोटीन", emoji:"🥤", protein:20, serving:"200ml", category:"brand", veg:true },
  { id:"amul_paneer_100g", name:"Amul Malai Paneer", nameHi:"अमूल पनीर", emoji:"🧀", protein:18, serving:"100g", category:"brand", veg:true },

  // Protein Powders
  { id:"on_whey", name:"ON Gold Standard Whey", nameHi:"ओ.एन. व्हे", emoji:"💪", protein:24, serving:"1 scoop (31g)", category:"powder", veg:true },
  { id:"mb_biozyme", name:"MuscleBlaze Biozyme", nameHi:"बायोज़ाइम", emoji:"💪", protein:25, serving:"1 scoop (33g)", category:"powder", veg:true },
  { id:"mb_raw_whey", name:"MuscleBlaze Raw Whey", nameHi:"रॉ व्हे", emoji:"💪", protein:24, serving:"1 scoop (33g)", category:"powder", veg:true },
  { id:"myprotein_impact", name:"Myprotein Impact Whey", nameHi:"माइप्रोटीन", emoji:"💪", protein:21, serving:"1 scoop (25g)", category:"powder", veg:true },
  { id:"nakpro_perform", name:"Nakpro Perform Whey", nameHi:"नकप्रो", emoji:"💪", protein:24, serving:"1 scoop (33g)", category:"powder", veg:true },
  { id:"as_it_is_whey", name:"AS-IT-IS Whey", nameHi:"एज़-इट-इज़", emoji:"💪", protein:24, serving:"1 scoop (30g)", category:"powder", veg:true },
  { id:"oziva_plant", name:"OZiva Plant Protein", nameHi:"ओज़िवा", emoji:"🌿", protein:25, serving:"1 scoop (40g)", category:"powder", veg:true },
  { id:"boldfit_whey", name:"Boldfit Whey", nameHi:"बोल्डफिट", emoji:"💪", protein:24, serving:"1 scoop (33g)", category:"powder", veg:true },
  { id:"fast_up_plant", name:"Fast&Up Plant Protein", nameHi:"फ़ास्ट एंड अप", emoji:"🌿", protein:30, serving:"1 scoop (45g)", category:"powder", veg:true },
  { id:"avvatar_whey", name:"Avvatar Whey", nameHi:"अवतार व्हे", emoji:"💪", protein:24, serving:"1 scoop (32g)", category:"powder", veg:true },
  { id:"plix_plant", name:"Plix Plant Protein", nameHi:"प्लिक्स", emoji:"🌿", protein:25, serving:"1 scoop (35g)", category:"powder", veg:true },
  { id:"sattu_powder", name:"Sattu Powder", nameHi:"सत्तू", emoji:"🥤", protein:20, serving:"2 tbsp (40g)", category:"powder", veg:true },

  // Soy & Nuts
  { id:"soy_chunks", name:"Soy Chunks", nameHi:"सोया चंक्स", emoji:"🟤", protein:26, serving:"50g dry", category:"soy", veg:true },
  { id:"tofu", name:"Tofu", nameHi:"टोफू", emoji:"🟨", protein:10, serving:"100g", category:"soy", veg:true },
  { id:"soy_milk", name:"Soy Milk", nameHi:"सोया दूध", emoji:"🥛", protein:7, serving:"1 glass", category:"soy", veg:true },
  { id:"peanuts", name:"Peanuts", nameHi:"मूंगफली", emoji:"🥜", protein:7, serving:"30g", category:"soy", veg:true },
  { id:"almonds", name:"Almonds", nameHi:"बादाम", emoji:"🌰", protein:6, serving:"15 pcs", category:"soy", veg:true },
  { id:"peanut_butter", name:"Peanut Butter", nameHi:"पीनट बटर", emoji:"🥜", protein:8, serving:"2 tbsp", category:"soy", veg:true },
  { id:"cashews", name:"Cashews", nameHi:"काजू", emoji:"🥜", protein:5, serving:"15 pcs", category:"soy", veg:true },
  { id:"chana_roasted", name:"Roasted Chana", nameHi:"भुना चना", emoji:"🫘", protein:10, serving:"50g", category:"soy", veg:true },
  { id:"flax_seeds", name:"Flax Seeds", nameHi:"अलसी", emoji:"🌱", protein:5, serving:"2 tbsp", category:"soy", veg:true },
  { id:"hemp_seeds", name:"Hemp Seeds", nameHi:"भांग बीज", emoji:"🌱", protein:10, serving:"3 tbsp", category:"soy", veg:true },

  // Grains
  { id:"roti", name:"Roti", nameHi:"रोटी", emoji:"🫓", protein:3, serving:"1 pc", category:"grain", veg:true },
  { id:"paratha", name:"Paratha", nameHi:"पराठा", emoji:"🫓", protein:4, serving:"1 pc", category:"grain", veg:true },
  { id:"rice", name:"Rice", nameHi:"चावल", emoji:"🍚", protein:4, serving:"1 bowl", category:"grain", veg:true },
  { id:"poha", name:"Poha", nameHi:"पोहा", emoji:"🍚", protein:5, serving:"1 plate", category:"grain", veg:true },
  { id:"upma", name:"Upma", nameHi:"उपमा", emoji:"🍲", protein:5, serving:"1 bowl", category:"grain", veg:true },
  { id:"idli", name:"Idli", nameHi:"इडली", emoji:"⚪", protein:4, serving:"2 pcs", category:"grain", veg:true },
  { id:"dosa", name:"Dosa", nameHi:"डोसा", emoji:"🥞", protein:5, serving:"1 pc", category:"grain", veg:true },
  { id:"besan_chilla", name:"Besan Chilla", nameHi:"बेसन चीला", emoji:"🥞", protein:10, serving:"2 pcs", category:"grain", veg:true },
  { id:"oats", name:"Oats", nameHi:"ओट्स", emoji:"🥣", protein:5, serving:"40g", category:"grain", veg:true },
  { id:"daliya", name:"Daliya", nameHi:"दलिया", emoji:"🥣", protein:6, serving:"1 bowl", category:"grain", veg:true },
  { id:"multigrain_roti", name:"Multigrain Roti", nameHi:"मल्टीग्रेन", emoji:"🫓", protein:5, serving:"1 pc", category:"grain", veg:true },
  { id:"chickpea_pasta", name:"Chickpea Pasta", nameHi:"चने का पास्ता", emoji:"🍝", protein:14, serving:"100g dry", category:"grain", veg:true },
  { id:"lentil_pasta", name:"Lentil Pasta (Red)", nameHi:"दाल पास्ता", emoji:"🍝", protein:13, serving:"100g dry", category:"grain", veg:true },
  { id:"soy_pasta", name:"Soy Pasta", nameHi:"सोया पास्ता", emoji:"🍝", protein:20, serving:"100g dry", category:"grain", veg:true },
  { id:"quinoa", name:"Quinoa", nameHi:"क्विनोआ", emoji:"🌾", protein:8, serving:"1 bowl cooked", category:"grain", veg:true },
  { id:"brown_rice", name:"Brown Rice", nameHi:"ब्राउन राइस", emoji:"🍚", protein:5, serving:"1 bowl", category:"grain", veg:true },
  { id:"amaranth", name:"Amaranth / Rajgira", nameHi:"राजगिरा", emoji:"🌾", protein:7, serving:"50g dry", category:"grain", veg:true },
  { id:"buckwheat", name:"Buckwheat / Kuttu", nameHi:"कुट्टू", emoji:"🌾", protein:6, serving:"50g dry", category:"grain", veg:true },
  { id:"protein_roti", name:"Protein Atta Roti", nameHi:"प्रोटीन आटा", emoji:"🫓", protein:6, serving:"1 pc", category:"grain", veg:true },
  { id:"millets", name:"Millet (Bajra/Jowar)", nameHi:"बाजरा/ज्वार", emoji:"🌾", protein:5, serving:"1 roti", category:"grain", veg:true },

  // Veg Snacks
  { id:"samosa", name:"Samosa", nameHi:"समोसा", emoji:"🔺", protein:3, serving:"1 pc", category:"snack", veg:true },
  { id:"dhokla", name:"Dhokla", nameHi:"ढोकला", emoji:"🟨", protein:7, serving:"4 pcs", category:"snack", veg:true },
  { id:"chana_chaat", name:"Chana Chaat", nameHi:"चना चाट", emoji:"🥗", protein:10, serving:"1 bowl", category:"snack", veg:true },
  { id:"thepla", name:"Thepla", nameHi:"थेपला", emoji:"🫓", protein:5, serving:"2 pcs", category:"snack", veg:true },
  { id:"makhana", name:"Makhana", nameHi:"मखाना", emoji:"⚪", protein:5, serving:"1 bowl", category:"snack", veg:true },
  { id:"moong_chilla", name:"Moong Dal Chilla", nameHi:"मूंग चीला", emoji:"🥞", protein:12, serving:"2 pcs", category:"snack", veg:true },

  // ==== NON-VEG ====
  // Eggs
  { id:"egg_boiled", name:"Boiled Egg", nameHi:"उबला अंडा", emoji:"🥚", protein:6, serving:"1 pc", category:"nonveg", veg:false },
  { id:"egg_bhurji", name:"Egg Bhurji", nameHi:"अंडा भुर्जी", emoji:"🍳", protein:14, serving:"2 eggs", category:"nonveg", veg:false },
  { id:"omelette", name:"Omelette", nameHi:"आमलेट", emoji:"🍳", protein:12, serving:"2 eggs", category:"nonveg", veg:false },
  { id:"egg_curry", name:"Egg Curry", nameHi:"अंडा करी", emoji:"🥘", protein:14, serving:"2 eggs", category:"nonveg", veg:false },

  // Chicken
  { id:"chicken_breast", name:"Chicken Breast", nameHi:"चिकन ब्रेस्ट", emoji:"🍗", protein:31, serving:"100g", category:"nonveg", veg:false },
  { id:"chicken_curry", name:"Chicken Curry", nameHi:"चिकन करी", emoji:"🍛", protein:22, serving:"1 bowl", category:"nonveg", veg:false },
  { id:"tandoori_chicken", name:"Tandoori Chicken", nameHi:"तंदूरी चिकन", emoji:"🍗", protein:25, serving:"2 pcs", category:"nonveg", veg:false },
  { id:"chicken_tikka", name:"Chicken Tikka", nameHi:"चिकन टिक्का", emoji:"🍢", protein:24, serving:"6 pcs", category:"nonveg", veg:false },
  { id:"butter_chicken", name:"Butter Chicken", nameHi:"बटर चिकन", emoji:"🍛", protein:20, serving:"1 bowl", category:"nonveg", veg:false },
  { id:"chicken_biryani", name:"Chicken Biryani", nameHi:"चिकन बिरयानी", emoji:"🍚", protein:22, serving:"1 plate", category:"nonveg", veg:false },

  // Fish & Mutton
  { id:"fish_fry", name:"Fish Fry", nameHi:"फिश फ्राई", emoji:"🐟", protein:20, serving:"1 pc", category:"nonveg", veg:false },
  { id:"fish_curry", name:"Fish Curry", nameHi:"फिश करी", emoji:"🍛", protein:18, serving:"1 bowl", category:"nonveg", veg:false },
  { id:"prawns", name:"Prawns", nameHi:"झींगा", emoji:"🦐", protein:20, serving:"100g", category:"nonveg", veg:false },
  { id:"mutton_curry", name:"Mutton Curry", nameHi:"मटन करी", emoji:"🍖", protein:25, serving:"1 bowl", category:"nonveg", veg:false },
  { id:"keema", name:"Keema", nameHi:"कीमा", emoji:"🍖", protein:22, serving:"1 bowl", category:"nonveg", veg:false },
  { id:"chicken_momos", name:"Chicken Momos", nameHi:"चिकन मोमो", emoji:"🥟", protein:12, serving:"6 pcs", category:"nonveg", veg:false },
];

const CATEGORIES = [
  { id:"all", label:"All", emoji:"🍽️" },
  { id:"dal", label:"Dal & Pulses", emoji:"🫘" },
  { id:"dairy", label:"Dairy", emoji:"🥛" },
  { id:"brand", label:"Brands", emoji:"🏷️" },
  { id:"powder", label:"Protein Powder", emoji:"💪" },
  { id:"soy", label:"Soy & Nuts", emoji:"🥜" },
  { id:"grain", label:"Grains", emoji:"🫓" },
  { id:"snack", label:"Snacks", emoji:"🥗" },
  { id:"nonveg", label:"Non-Veg", emoji:"🍗" },
];

const MEALS = [
  { id:"breakfast", label:"Breakfast", shortLabel:"Bfast", emoji:"🌅" },
  { id:"lunch", label:"Lunch", shortLabel:"Lunch", emoji:"☀️" },
  { id:"dinner", label:"Dinner", shortLabel:"Dinner", emoji:"🌙" },
  { id:"snacks", label:"Snacks", shortLabel:"Snacks", emoji:"🍿", anytime:true },
];

const PROTEIN_TIPS = [
  { title:"Dahi > Milk for protein", body:"200g curd has more protein per calorie than milk. Switch evening milk to thick dahi.", icon:"🥛" },
  { title:"Soy chunks are OP", body:"50g dry soy chunks = 26g protein for under ₹10. More protein per rupee than whey.", icon:"🟤" },
  { title:"Sattu — India's OG shake", body:"2 tbsp sattu + water + lemon + salt = 20g protein. Bihar figured it out centuries ago.", icon:"🥤" },
  { title:"The chana swap", body:"Replace aloo in any sabzi with chana. Aloo gobi → chana gobi. Same masala, 3x protein.", icon:"🫘" },
  { title:"Besan is a protein hack", body:"Besan has ~22g protein per 100g. Chilla, pakora, kadhi — high protein hiding in plain sight.", icon:"🥞" },
  { title:"Paneer bhurji > plain paneer", body:"Crumbled paneer feels like more food. 100g bhurji = 18g protein, fills like a full meal.", icon:"🧀" },
  { title:"Sprouts are free protein", body:"Soak moong overnight, sprout for a day. 1 bowl = 13g protein. Cost: basically nothing.", icon:"🌱" },
  { title:"The 2-egg rule", body:"2 eggs in any form = 12-14g protein. That's 20% of your target before 9 AM.", icon:"🥚" },
  { title:"Double your dal", body:"Mix 2 dals (moong+masoor, toor+chana dal). Better amino acids and tastier too.", icon:"🥣" },
  { title:"Amul protein range", body:"At ₹30-50 per pack with 20g protein, Amul protein milk/lassi is insanely cheap.", icon:"🏷️" },
  { title:"Peanut butter habit", body:"2 tbsp PB on roti = 8g extra protein. Works for breakfast, snack, or post-workout.", icon:"🥜" },
  { title:"Chicken breast math", body:"100g chicken breast = 31g protein. The highest protein-per-gram of any common Indian food.", icon:"🍗" },
];

const MESSAGES = {
  low:["Abhi toh shuruat hai! 💪","Thoda aur protein chahiye!","Keep going!"],
  mid:["Accha ja raha hai! 🔥","Halfway — ek bowl dal aur!","Nice progress!"],
  high:["Almost done! 🎯","Bas thoda sa aur!","Killing it today!"],
  done:["FULL PROTEIN! 🏆","Target hit — maa proud hogi! 💚","Champion! 🎉"],
};

function getMsg(c,t){const p=c/t;const a=p>=1?MESSAGES.done:p>=.7?MESSAGES.high:p>=.3?MESSAGES.mid:MESSAGES.low;return a[Math.floor(Math.random()*a.length)];}

// ============ COMPONENTS ============

function CircularProgress({current,target,size=180}){
  const p=Math.min(current/target,1),r=(size-20)/2,ci=2*Math.PI*r,off=ci-p*ci;
  const col=p>=1?"#22c55e":p>=.7?"#f59e0b":p>=.3?"#fb923c":"#ef4444";
  return(
    <div style={{position:"relative",width:size,height:size,margin:"0 auto"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={ci} strokeDashoffset={off} style={{transition:"stroke-dashoffset .5s ease,stroke .3s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:"2.6rem",fontWeight:800,color:"#fff",lineHeight:1,fontFamily:"'Teko',sans-serif"}}>{current}g</span>
        <span style={{fontSize:".78rem",color:"rgba(255,255,255,.4)",marginTop:2}}>of {target}g</span>
      </div>
    </div>
  );
}

function FoodCard({food,count,onAdd,onRemove}){
  const a=count>0;
  return(
    <div style={{
      background:a?"rgba(234,179,8,.12)":"rgba(255,255,255,.03)",
      border:a?"1.5px solid rgba(234,179,8,.35)":"1.5px solid rgba(255,255,255,.07)",
      borderRadius:14,padding:"10px 6px",cursor:"pointer",
      display:"flex",flexDirection:"column",alignItems:"center",gap:3,
      position:"relative",userSelect:"none",minHeight:100,transition:"all .15s",
    }}>
      {!food.veg&&<div style={{position:"absolute",top:4,left:4,width:10,height:10,border:"1.5px solid #ef4444",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#ef4444"}}/></div>}
      {food.veg&&<div style={{position:"absolute",top:4,left:4,width:10,height:10,border:"1.5px solid #22c55e",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/></div>}
      <span style={{fontSize:"1.5rem",lineHeight:1,marginTop:4}}>{food.emoji}</span>
      <span style={{fontSize:".68rem",fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.15,fontFamily:"'Nunito',sans-serif"}}>{food.name}</span>
      <span style={{fontSize:".55rem",color:"rgba(255,255,255,.3)",textAlign:"center",lineHeight:1.1}}>{food.serving}</span>
      <span style={{fontSize:".8rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif"}}>{food.protein}g</span>
      {/* Qty stepper */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginTop:2}} onClick={e=>e.stopPropagation()}>
        <button onClick={(e)=>{e.stopPropagation();onRemove();}} style={{
          width:26,height:24,borderRadius:"8px 0 0 8px",border:"1px solid rgba(255,255,255,.1)",
          background:count>0?"rgba(239,68,68,.15)":"rgba(255,255,255,.04)",color:count>0?"#ef4444":"rgba(255,255,255,.2)",
          fontSize:".9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>−</button>
        <div style={{
          width:28,height:24,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderLeft:"none",borderRight:"none",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:".75rem",fontWeight:800,color:count>0?"#eab308":"rgba(255,255,255,.2)",
        }}>{count}</div>
        <button onClick={(e)=>{e.stopPropagation();onAdd();}} style={{
          width:26,height:24,borderRadius:"0 8px 8px 0",border:"1px solid rgba(255,255,255,.1)",
          background:"rgba(234,179,8,.12)",color:"#eab308",
          fontSize:".9rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>+</button>
      </div>
    </div>
  );
}

function MealBar({meal,protein,isActive,onClick}){
  return(
    <button onClick={onClick} style={{
      flex:1,background:isActive?"rgba(234,179,8,.15)":"rgba(255,255,255,.03)",
      border:isActive?"1.5px solid rgba(234,179,8,.4)":"1.5px solid rgba(255,255,255,.06)",
      borderRadius:12,padding:"7px 3px",cursor:"pointer",textAlign:"center",
      display:"flex",flexDirection:"column",alignItems:"center",gap:1,
    }}>
      <span style={{fontSize:"1rem"}}>{meal.emoji}</span>
      <span style={{fontSize:".6rem",fontWeight:700,color:isActive?"#eab308":"rgba(255,255,255,.45)",fontFamily:"'Nunito',sans-serif"}}>{meal.shortLabel||meal.label}</span>
      {meal.anytime&&<span style={{fontSize:".48rem",color:"rgba(255,255,255,.2)",marginTop:-2}}>anytime</span>}
      <span style={{fontSize:".82rem",fontWeight:800,color:protein>0?"#eab308":"rgba(255,255,255,.12)",fontFamily:"'Teko',sans-serif"}}>{protein}g</span>
    </button>
  );
}

function ProteinCalcModal({onClose,onSetTarget}){
  const[weight,setWeight]=useState("");
  const[activity,setActivity]=useState("moderate");
  const mult={sedentary:0.8,moderate:1.0,active:1.2,athlete:1.6};
  const calc=weight?Math.round(parseFloat(weight)*mult[activity]):0;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#1a1a1a",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
        <h3 style={{color:"#eab308",fontSize:"1.3rem",fontFamily:"'Teko',sans-serif",fontWeight:700,marginBottom:4}}>🧮 Protein Calculator</h3>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:".75rem",marginBottom:16}}>How much protein do YOU need daily?</p>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:".78rem",color:"rgba(255,255,255,.5)",display:"block",marginBottom:6}}>Your weight (kg)</label>
          <input value={weight} onChange={e=>setWeight(e.target.value)} type="number" placeholder="e.g. 70"
            style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:"1.1rem",outline:"none",fontFamily:"'Teko',sans-serif",fontWeight:700}} />
        </div>
        <div style={{marginBottom:18}}>
          <label style={{fontSize:".78rem",color:"rgba(255,255,255,.5)",display:"block",marginBottom:8}}>Activity level</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{k:"sedentary",l:"Sedentary",d:"Desk job, no gym",m:"0.8g/kg"},{k:"moderate",l:"Moderate",d:"Some exercise",m:"1.0g/kg"},{k:"active",l:"Active",d:"Regular gym/sports",m:"1.2g/kg"},{k:"athlete",l:"Athlete",d:"Heavy training",m:"1.6g/kg"}].map(a=>(
              <button key={a.k} onClick={()=>setActivity(a.k)} style={{
                background:activity===a.k?"rgba(234,179,8,.15)":"rgba(255,255,255,.04)",
                border:activity===a.k?"1.5px solid #eab308":"1.5px solid rgba(255,255,255,.08)",
                borderRadius:12,padding:"10px 8px",cursor:"pointer",textAlign:"left",
              }}>
                <div style={{fontSize:".8rem",fontWeight:700,color:activity===a.k?"#eab308":"#fff"}}>{a.l}</div>
                <div style={{fontSize:".62rem",color:"rgba(255,255,255,.35)",marginTop:2}}>{a.d}</div>
                <div style={{fontSize:".7rem",color:"rgba(255,255,255,.25)",marginTop:1}}>{a.m}</div>
              </button>
            ))}
          </div>
        </div>
        {calc>0&&(
          <div style={{background:"rgba(234,179,8,.08)",border:"1px solid rgba(234,179,8,.25)",borderRadius:14,padding:16,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:".7rem",color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:1}}>You need</div>
            <div style={{fontSize:"3rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif",lineHeight:1}}>{calc}g</div>
            <div style={{fontSize:".75rem",color:"rgba(255,255,255,.4)"}}>protein per day</div>
            <div style={{fontSize:".65rem",color:"rgba(255,255,255,.25)",marginTop:6}}>{weight}kg × {mult[activity]}g/kg = {calc}g</div>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:12,padding:"12px",fontSize:".88rem",cursor:"pointer"}}>Close</button>
          {calc>0&&<button onClick={()=>{onSetTarget(calc);onClose();}} style={{flex:1,background:"#eab308",border:"none",color:"#000",borderRadius:12,padding:"12px",fontSize:".88rem",fontWeight:800,cursor:"pointer"}}>Set {calc}g as Target</button>}
        </div>
      </div>
    </div>
  );
}

function AddCustomModal({onAdd,onClose}){
  const[name,setName]=useState("");const[protein,setProtein]=useState("");const[serving,setServing]=useState("");const[isVeg,setIsVeg]=useState(true);
  const submit=()=>{if(!name.trim()||!protein)return;onAdd({id:"c_"+Date.now(),name:name.trim(),nameHi:"",emoji:"✨",protein:parseInt(protein)||0,serving:serving.trim()||"1 serving",category:"custom",isCustom:true,veg:isVeg});onClose();};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#1a1a1a",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
        <h3 style={{color:"#eab308",fontSize:"1.2rem",fontFamily:"'Teko',sans-serif",fontWeight:700,marginBottom:4}}>Add Custom Food / Brand</h3>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:".72rem",marginBottom:16}}>Help build India's protein database!</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Food or brand name" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:".88rem",outline:"none"}}/>
          <div style={{display:"flex",gap:8}}>
            <input value={protein} onChange={e=>setProtein(e.target.value)} placeholder="Protein (g)" type="number" style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:".88rem",outline:"none"}}/>
            <input value={serving} onChange={e=>setServing(e.target.value)} placeholder="Serving" style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:".88rem",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setIsVeg(true)} style={{flex:1,background:isVeg?"rgba(34,197,94,.12)":"rgba(255,255,255,.04)",border:isVeg?"1.5px solid #22c55e":"1.5px solid rgba(255,255,255,.08)",color:isVeg?"#22c55e":"rgba(255,255,255,.4)",borderRadius:10,padding:"8px",fontSize:".82rem",fontWeight:700,cursor:"pointer"}}>🟢 Veg</button>
            <button onClick={()=>setIsVeg(false)} style={{flex:1,background:!isVeg?"rgba(239,68,68,.12)":"rgba(255,255,255,.04)",border:!isVeg?"1.5px solid #ef4444":"1.5px solid rgba(255,255,255,.08)",color:!isVeg?"#ef4444":"rgba(255,255,255,.4)",borderRadius:10,padding:"8px",fontSize:".82rem",fontWeight:700,cursor:"pointer"}}>🔴 Non-Veg</button>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button onClick={onClose} style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:12,padding:"11px",fontSize:".88rem",cursor:"pointer"}}>Cancel</button>
            <button onClick={submit} style={{flex:1,background:"#eab308",border:"none",color:"#000",borderRadius:12,padding:"11px",fontSize:".88rem",fontWeight:800,cursor:"pointer",opacity:(!name.trim()||!protein)?.4:1}}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryView({history,target,allFoods,onClose}){
  const days=Object.entries(history).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30);
  const calcDay=(dayData)=>{
    return MEALS.reduce((s,m)=>{
      return s+Object.entries(dayData[m.id]||{}).reduce((ss,[id,c])=>{
        const f=allFoods.find(fd=>fd.id===id);return ss+(f?f.protein*c:0);
      },0);
    },0);
  };
  const streak=(()=>{let s=0;const sorted=[...days];for(const[_,d] of sorted){if(calcDay(d)>=target)s++;else break;}return s;})();
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:250,display:"flex",flexDirection:"column",padding:0,backdropFilter:"blur(8px)",overflow:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:480,margin:"0 auto",width:"100%",padding:20,minHeight:"100vh"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{color:"#eab308",fontSize:"1.5rem",fontFamily:"'Teko',sans-serif",fontWeight:700}}>📊 Protein History</h2>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:10,padding:"6px 14px",fontSize:".8rem",cursor:"pointer"}}>✕ Close</button>
        </div>
        {streak>0&&(
          <div style={{background:"rgba(234,179,8,.08)",border:"1px solid rgba(234,179,8,.2)",borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:"2rem"}}>🔥</span>
            <div>
              <div style={{fontSize:"1.4rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif"}}>{streak}-day streak!</div>
              <div style={{fontSize:".72rem",color:"rgba(255,255,255,.4)"}}>Consecutive days hitting your target</div>
            </div>
          </div>
        )}
        {/* Mini bar chart */}
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:100,padding:"0 4px"}}>
            {days.slice(0,14).reverse().map(([date,data])=>{
              const g=calcDay(data);const pct=Math.min(g/target,1.3);const hit=g>=target;
              return(
                <div key={date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{fontSize:".55rem",color:hit?"#22c55e":"rgba(255,255,255,.3)",fontWeight:700,fontFamily:"'Teko',sans-serif"}}>{g}g</div>
                  <div style={{width:"100%",height:Math.max(pct*60,4),background:hit?"rgba(34,197,94,.5)":"rgba(234,179,8,.3)",borderRadius:4,transition:"height .3s"}}/>
                  <div style={{fontSize:".5rem",color:"rgba(255,255,255,.2)"}}>{date.slice(8)}</div>
                </div>
              );
            })}
          </div>
          <div style={{height:1,background:"rgba(255,255,255,.06)",marginTop:4}}/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 4px 0"}}>
            <span style={{fontSize:".55rem",color:"rgba(255,255,255,.2)"}}>Last 14 days</span>
            <span style={{fontSize:".55rem",color:"rgba(255,255,255,.2)"}}>Target: {target}g</span>
          </div>
        </div>

        {days.length===0&&<p style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:40}}>No history yet. Start tracking today!</p>}
        {days.map(([date,data])=>{
          const g=calcDay(data);const pct=Math.round((g/target)*100);const hit=g>=target;
          const d=new Date(date+"T12:00:00");
          const label=date===getTodayKey()?"Today":d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
          return(
            <div key={date} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontSize:".85rem",fontWeight:700,color:"#fff"}}>{label}</span>
                  <span style={{fontSize:".7rem",color:"rgba(255,255,255,.25)",marginLeft:8}}>{date}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"1.1rem",fontWeight:800,color:hit?"#22c55e":"#eab308",fontFamily:"'Teko',sans-serif"}}>{g}g</span>
                  <span style={{fontSize:".65rem",background:hit?"rgba(34,197,94,.15)":"rgba(234,179,8,.1)",color:hit?"#22c55e":"#eab308",borderRadius:10,padding:"2px 8px",fontWeight:700}}>{pct}%</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:8}}>
                {MEALS.map(m=>{
                  const mp=Object.entries(data[m.id]||{}).reduce((s,[id,c])=>{const f=allFoods.find(fd=>fd.id===id);return s+(f?f.protein*c:0);},0);
                  return <div key={m.id} style={{flex:1,textAlign:"center",fontSize:".65rem",color:mp>0?"rgba(255,255,255,.5)":"rgba(255,255,255,.15)"}}>{m.emoji} {mp}g</div>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShareCard({current,target,mealData,allFoods}){
  const pct=Math.round((current/target)*100);
  return(
    <div style={{background:"linear-gradient(135deg,#1a1205,#2d1f0a,#1a1205)",border:"1.5px solid rgba(234,179,8,.3)",borderRadius:20,padding:"24px 20px",maxWidth:340,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:2}}>Today's Protein Score</div>
        <div style={{fontSize:"3rem",fontWeight:800,color:"#eab308",lineHeight:1.1,fontFamily:"'Teko',sans-serif"}}>{current}g / {target}g</div>
        <div style={{display:"inline-block",background:pct>=100?"#22c55e":"#eab308",color:"#000",borderRadius:20,padding:"2px 12px",fontSize:".7rem",fontWeight:700,marginTop:4}}>{pct}%</div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {MEALS.map(m=>{
          const mp=Object.entries(mealData[m.id]||{}).reduce((s,[id,c])=>{const f=allFoods.find(fd=>fd.id===id);return s+(f?f.protein*c:0);},0);
          return(<div key={m.id} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,.04)",borderRadius:10,padding:"5px 3px"}}>
            <div style={{fontSize:".85rem"}}>{m.emoji}</div>
            <div style={{fontSize:".55rem",color:"rgba(255,255,255,.25)"}}>{m.label}</div>
            <div style={{fontSize:".82rem",fontWeight:700,color:mp>0?"#eab308":"rgba(255,255,255,.12)",fontFamily:"'Teko',sans-serif"}}>{mp}g</div>
          </div>);
        })}
      </div>
      <div style={{textAlign:"center",fontSize:".58rem",color:"rgba(255,255,255,.18)"}}>Protein Tracker · protein-tracker.vercel.app</div>
    </div>
  );
}

function TipsSection(){
  const[expanded,setExpanded]=useState(false);const[active,setActive]=useState(null);
  const tips=expanded?PROTEIN_TIPS:PROTEIN_TIPS.slice(0,4);
  return(
    <div style={{padding:"4px 20px 0"}}>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {tips.map((t,i)=>(
          <div key={i} onClick={()=>setActive(active===i?null:i)} style={{background:active===i?"rgba(234,179,8,.08)":"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"11px 13px",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:"1.2rem"}}>{t.icon}</span>
              <span style={{fontSize:".82rem",fontWeight:700,color:"#fff",flex:1}}>{t.title}</span>
              <span style={{fontSize:".75rem",color:"rgba(255,255,255,.25)",transform:active===i?"rotate(180deg)":"none",transition:".2s"}}>▼</span>
            </div>
            {active===i&&<p style={{margin:"8px 0 0",fontSize:".78rem",color:"rgba(255,255,255,.5)",lineHeight:1.5,paddingLeft:34}}>{t.body}</p>}
          </div>
        ))}
      </div>
      {!expanded&&<button onClick={()=>setExpanded(true)} style={{width:"100%",background:"none",border:"1px dashed rgba(255,255,255,.1)",borderRadius:12,padding:"9px",color:"rgba(255,255,255,.25)",fontSize:".78rem",cursor:"pointer",marginTop:8}}>Show all {PROTEIN_TIPS.length} tips ▼</button>}
    </div>
  );
}

// ============ MAIN APP ============
export default function ProteinTracker(){
  const[mealData,setMealData]=useState({breakfast:{},lunch:{},snacks:{},dinner:{}});
  const[activeMeal,setActiveMeal]=useState("breakfast");
  const[activeCategory,setActiveCategory]=useState("all");
  const[searchQuery,setSearchQuery]=useState("");
  const[showShare,setShowShare]=useState(false);
  const[showOnboarding,setShowOnboarding]=useState(true);
  const[showAddCustom,setShowAddCustom]=useState(false);
  const[showCalc,setShowCalc]=useState(false);
  const[showHistory,setShowHistory]=useState(false);
  const[targetProtein,setTargetProtein]=useState(60);
  const[customTarget,setCustomTarget]=useState("");
  const[customFoods,setCustomFoods]=useState([]);
  const[activeTab,setActiveTab]=useState("track");
  const[vegOnly,setVegOnly]=useState(false);
  const[profile,setProfile]=useState(null); // {name,weight}
  const[history,setHistory]=useState({});
  const[loaded,setLoaded]=useState(false);
  const[profileName,setProfileName]=useState("");
  const[toast,setToast]=useState("");
  const[communityEmail,setCommunityEmail]=useState("");
  const[emailSubmitted,setEmailSubmitted]=useState(false);
  const saveTimer=useRef(null);

  const allFoods=[...FOOD_DATA,...customFoods];

  // Load from storage on mount
  useEffect(()=>{
    (async()=>{
      const p=await loadStorage(STORAGE_KEYS.PROFILE,null);
      const h=await loadStorage(STORAGE_KEYS.HISTORY,{});
      const cf=await loadStorage(STORAGE_KEYS.CUSTOM_FOODS,[]);
      const today=await loadStorage(STORAGE_KEYS.TODAY,null);
      if(p){setProfile(p);setTargetProtein(p.target||60);setVegOnly(p.vegOnly||false);setShowOnboarding(false);setProfileName(p.name||"");}
      if(h)setHistory(h);
      if(cf)setCustomFoods(cf);
      if(today&&today.date===getTodayKey()){setMealData(today.meals);}
      const es=await loadStorage("pkh-email-submitted",false);
      if(es)setEmailSubmitted(true);
      setLoaded(true);
    })();
  },[]);

  // Auto-save today's data (debounced)
  useEffect(()=>{
    if(!loaded||showOnboarding)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      const todayKey=getTodayKey();
      saveStorage(STORAGE_KEYS.TODAY,{date:todayKey,meals:mealData});
      // Also save to history
      setHistory(prev=>{
        const next={...prev,[todayKey]:mealData};
        saveStorage(STORAGE_KEYS.HISTORY,next);
        return next;
      });
    },800);
  },[mealData,loaded,showOnboarding]);

  // Save custom foods
  useEffect(()=>{if(loaded)saveStorage(STORAGE_KEYS.CUSTOM_FOODS,customFoods);},[customFoods,loaded]);

  const getMealProtein=(mid)=>Object.entries(mealData[mid]||{}).reduce((s,[id,c])=>{const f=allFoods.find(fd=>fd.id===id);return s+(f?f.protein*c:0);},0);
  const totalProtein=MEALS.reduce((s,m)=>s+getMealProtein(m.id),0);
  const totalItems=Object.values(mealData).reduce((s,m)=>s+Object.values(m).reduce((a,b)=>a+b,0),0);
  const currentMealItems=mealData[activeMeal]||{};

  const filteredFoods=allFoods.filter(f=>{
    if(vegOnly&&!f.veg)return false;
    const catMatch=activeCategory==="all"||f.category===activeCategory||(activeCategory==="custom"&&f.isCustom);
    const searchMatch=!searchQuery||f.name.toLowerCase().includes(searchQuery.toLowerCase())||(f.nameHi&&f.nameHi.includes(searchQuery));
    return catMatch&&searchMatch;
  });

  const addItem=(id)=>setMealData(p=>({...p,[activeMeal]:{...p[activeMeal],[id]:(p[activeMeal][id]||0)+1}}));
  const removeItem=(id)=>setMealData(p=>{const n=(p[activeMeal][id]||0)-1;const m={...p[activeMeal]};if(n<=0)delete m[id];else m[id]=n;return{...p,[activeMeal]:m};});
  const resetAll=()=>{setMealData({breakfast:{},lunch:{},snacks:{},dinner:{}});setShowShare(false);};
  const addCustomFood=(f)=>{setCustomFoods(p=>[...p,f]);addItem(f.id);};

  const saveProfile=(name,tgt)=>{
    const p={name:name||profileName,target:tgt||targetProtein,vegOnly};
    setProfile(p);
    saveStorage(STORAGE_KEYS.PROFILE,p);
  };

  const handleShare=async()=>{
    const mealLines=MEALS.map(m=>{const mp=getMealProtein(m.id);const items=Object.entries(mealData[m.id]).filter(([_,c])=>c>0).map(([id,c])=>{const f=allFoods.find(fd=>fd.id===id);return f?`  ${f.emoji} ${f.name} ×${c} = ${f.protein*c}g`:'';}).filter(Boolean).join("\n");return mp>0?`${m.emoji} ${m.label}: ${mp}g\n${items}`:null;}).filter(Boolean).join("\n\n");
    const text=`🏆 Protein Tracker\n\nToday: ${totalProtein}g / ${targetProtein}g (${Math.round((totalProtein/targetProtein)*100)}%)\n\n${mealLines}\n\nTrack yours → protein-tracker.vercel.app`;
    if(navigator.share){try{await navigator.share({title:"Protein Tracker",text});}catch{}}
    else{try{await navigator.clipboard.writeText(text);alert("Copied! Share on WhatsApp 💬");}catch{}}
  };

  // ===== ONBOARDING =====
  if(showOnboarding){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0a0a,#1a1205,#0a0a0a)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif",color:"#fff"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}`}</style>
        <div style={{fontSize:"3.5rem",marginBottom:8,animation:"pulse 2s infinite"}}>💪</div>
        <h1 style={{fontSize:"2.4rem",fontWeight:800,textAlign:"center",fontFamily:"'Teko',sans-serif",color:"#eab308",lineHeight:1,marginBottom:4}}>Protein Tracker</h1>
        <p style={{fontSize:".95rem",color:"rgba(255,255,255,.4)",marginBottom:24}}>Track. Share. Build the habit.</p>

        <div style={{width:"100%",maxWidth:320,marginBottom:20}}>
          <label style={{fontSize:".75rem",color:"rgba(255,255,255,.35)",display:"block",marginBottom:6}}>Your name (for your profile)</label>
          <input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="e.g. Sumeet"
            style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:".95rem",outline:"none"}}/>
        </div>

        <div style={{marginBottom:24,textAlign:"center"}}>
          <p style={{fontSize:".75rem",color:"rgba(255,255,255,.3)",marginBottom:10}}>Daily protein target</p>
          <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
            {[50,60,70,80,100].map(t=>(
              <button key={t} onClick={()=>{setTargetProtein(t);setCustomTarget("");}} style={{
                background:targetProtein===t&&!customTarget?"rgba(234,179,8,.2)":"rgba(255,255,255,.04)",
                border:targetProtein===t&&!customTarget?"1.5px solid #eab308":"1.5px solid rgba(255,255,255,.08)",
                color:targetProtein===t&&!customTarget?"#eab308":"rgba(255,255,255,.45)",
                borderRadius:12,padding:"7px 15px",cursor:"pointer",fontSize:"1rem",fontWeight:700,fontFamily:"'Teko',sans-serif",
              }}>{t}g</button>
            ))}
          </div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <input type="number" placeholder="Custom" value={customTarget}
              onChange={e=>{setCustomTarget(e.target.value);if(e.target.value)setTargetProtein(parseInt(e.target.value)||60);}}
              style={{width:75,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"7px 10px",color:"#fff",fontSize:".88rem",textAlign:"center",outline:"none"}}/>
            <span style={{fontSize:".78rem",color:"rgba(255,255,255,.2)"}}>g</span>
          </div>
          <button onClick={()=>setShowCalc(true)} style={{marginTop:10,background:"none",border:"none",color:"#eab308",fontSize:".78rem",cursor:"pointer",textDecoration:"underline",opacity:.7}}>
            🧮 Don't know? Use protein calculator
          </button>
        </div>

        <div style={{marginBottom:24,display:"flex",gap:8}}>
          <button onClick={()=>setVegOnly(true)} style={{
            background:vegOnly?"rgba(34,197,94,.12)":"rgba(255,255,255,.04)",
            border:vegOnly?"1.5px solid #22c55e":"1.5px solid rgba(255,255,255,.08)",
            color:vegOnly?"#22c55e":"rgba(255,255,255,.4)",borderRadius:12,padding:"8px 20px",cursor:"pointer",fontSize:".88rem",fontWeight:700,
          }}>🟢 Veg Only</button>
          <button onClick={()=>setVegOnly(false)} style={{
            background:!vegOnly?"rgba(234,179,8,.12)":"rgba(255,255,255,.04)",
            border:!vegOnly?"1.5px solid #eab308":"1.5px solid rgba(255,255,255,.08)",
            color:!vegOnly?"#eab308":"rgba(255,255,255,.4)",borderRadius:12,padding:"8px 20px",cursor:"pointer",fontSize:".88rem",fontWeight:700,
          }}>🍽️ All Foods</button>
        </div>

        <button onClick={()=>{saveProfile(profileName,targetProtein);setShowOnboarding(false);}} style={{
          background:"#eab308",color:"#000",border:"none",borderRadius:16,padding:"14px 48px",
          fontSize:"1.1rem",fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",
          boxShadow:"0 4px 24px rgba(234,179,8,.3)",
        }}>Shuru Karo →</button>

        {showCalc&&<ProteinCalcModal onClose={()=>setShowCalc(false)} onSetTarget={t=>{setTargetProtein(t);setCustomTarget("");setToast("Target set to "+t+"g/day ✅");setTimeout(()=>setToast(""),3000);}}/>}
        {toast&&(
          <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"#22c55e",color:"#000",borderRadius:14,padding:"10px 22px",fontSize:".88rem",fontWeight:700,boxShadow:"0 4px 20px rgba(34,197,94,.4)"}}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ===== MAIN TRACKER =====
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0a0a,#111)",fontFamily:"'Nunito',sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",paddingBottom:110}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{display:none}input::placeholder{color:rgba(255,255,255,.22)}@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Header */}
      <div style={{padding:"14px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:".6rem",color:"rgba(255,255,255,.2)",textTransform:"uppercase",letterSpacing:2}}>
            {profile?.name?"Hi "+profile.name+" 👋":"Protein Tracker"}
          </div>
          <div style={{fontSize:".68rem",color:"rgba(255,255,255,.15)",marginTop:1}}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowHistory(true)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.35)",borderRadius:10,padding:"5px 10px",fontSize:".7rem",cursor:"pointer"}}>📊</button>
          <button onClick={()=>setShowCalc(true)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.35)",borderRadius:10,padding:"5px 10px",fontSize:".7rem",cursor:"pointer"}}>🧮</button>
          <button onClick={resetAll} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.35)",borderRadius:10,padding:"5px 10px",fontSize:".7rem",cursor:"pointer"}}>Reset</button>
        </div>
      </div>

      {/* Target pill */}
      <div style={{padding:"8px 20px 0",display:"flex",justifyContent:"center"}}>
        <button onClick={()=>setShowCalc(true)} style={{background:"rgba(234,179,8,.06)",border:"1px solid rgba(234,179,8,.15)",borderRadius:20,padding:"4px 14px",fontSize:".7rem",color:"#eab308",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          🎯 Daily Target: <strong>{targetProtein}g</strong> <span style={{color:"rgba(255,255,255,.25)",marginLeft:2}}>· tap to change</span>
        </button>
      </div>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"#22c55e",color:"#000",borderRadius:14,padding:"10px 22px",fontSize:".88rem",fontWeight:700,boxShadow:"0 4px 20px rgba(34,197,94,.4)",fontFamily:"'Nunito',sans-serif",animation:"fadeIn .3s ease"}}>
          {toast}
        </div>
      )}

      {/* Progress */}
      <div style={{padding:"14px 20px 4px"}}>
        <CircularProgress current={totalProtein} target={targetProtein}/>
        <p style={{textAlign:"center",marginTop:6,fontSize:".82rem",color:totalProtein>=targetProtein?"#22c55e":"rgba(255,255,255,.4)",fontWeight:600}}>
          {totalItems>0?getMsg(totalProtein,targetProtein):"Tap foods below to start"}
        </p>
      </div>

      {/* Meals */}
      <div style={{display:"flex",gap:7,padding:"6px 20px 12px"}}>
        {MEALS.map(m=><MealBar key={m.id} meal={m} protein={getMealProtein(m.id)} isActive={activeMeal===m.id} onClick={()=>setActiveMeal(m.id)}/>)}
      </div>

      {/* Current meal items */}
      {Object.keys(currentMealItems).length>0&&(
        <div style={{padding:"0 20px 8px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center"}}>
            {Object.entries(currentMealItems).filter(([_,c])=>c>0).map(([id,count])=>{
              const food=allFoods.find(f=>f.id===id);if(!food)return null;
              return(<span key={id} style={{background:"rgba(234,179,8,.08)",border:"1px solid rgba(234,179,8,.15)",borderRadius:20,padding:"2px 8px",fontSize:".66rem",color:"#eab308"}}>{food.emoji} {food.name} ×{count} ({food.protein*count}g)</span>);
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",padding:"0 20px 10px"}}>
        {[{id:"track",l:"🍽️ Track"},{id:"tips",l:"💡 Tips"},{id:"community",l:"👥 Community"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            flex:1,background:activeTab===t.id?"rgba(234,179,8,.1)":"transparent",
            border:"none",borderBottom:activeTab===t.id?"2px solid #eab308":"2px solid rgba(255,255,255,.05)",
            color:activeTab===t.id?"#eab308":"rgba(255,255,255,.3)",padding:"9px",
            fontSize:".82rem",fontWeight:700,cursor:"pointer",
          }}>{t.l}</button>
        ))}
      </div>

      {activeTab==="track"?(
        <>
          {/* Veg filter + Search */}
          <div style={{padding:"0 20px 8px",display:"flex",gap:8}}>
            <button onClick={()=>{setVegOnly(!vegOnly);saveProfile();}} style={{
              flexShrink:0,background:vegOnly?"rgba(34,197,94,.12)":"rgba(255,255,255,.04)",
              border:vegOnly?"1.5px solid #22c55e":"1.5px solid rgba(255,255,255,.07)",
              borderRadius:12,padding:"0 12px",cursor:"pointer",fontSize:".75rem",fontWeight:700,
              color:vegOnly?"#22c55e":"rgba(255,255,255,.35)",height:42,display:"flex",alignItems:"center",gap:4,
            }}>{vegOnly?"🟢 Veg":"🍽️ All"}</button>
            <input type="text" placeholder="🔍  Search... (paneer, amul, chicken)"
              value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              style={{flex:1,background:"rgba(255,255,255,.04)",border:"1.5px solid rgba(255,255,255,.07)",borderRadius:12,padding:"0 14px",color:"#fff",fontSize:".85rem",outline:"none",height:42}}/>
          </div>

          {/* Categories */}
          <div style={{display:"flex",gap:5,overflowX:"auto",padding:"0 20px 12px",WebkitOverflowScrolling:"touch"}}>
            {[...CATEGORIES.filter(c=>!vegOnly||c.id!=="nonveg"),...(customFoods.length>0?[{id:"custom",label:"My Foods",emoji:"✨"}]:[])].map(cat=>(
              <button key={cat.id} onClick={()=>setActiveCategory(cat.id)} style={{
                flexShrink:0,background:activeCategory===cat.id?"rgba(234,179,8,.12)":"rgba(255,255,255,.03)",
                border:activeCategory===cat.id?"1.5px solid rgba(234,179,8,.3)":"1.5px solid rgba(255,255,255,.05)",
                color:activeCategory===cat.id?"#eab308":"rgba(255,255,255,.35)",
                borderRadius:11,padding:"5px 11px",cursor:"pointer",fontSize:".7rem",fontWeight:600,whiteSpace:"nowrap",
              }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>

          {/* Food Grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"0 20px"}}>
            {filteredFoods.map(food=>(
              <FoodCard key={food.id} food={food} count={currentMealItems[food.id]||0} onAdd={()=>addItem(food.id)} onRemove={()=>removeItem(food.id)}/>
            ))}
          </div>
          {filteredFoods.length===0&&<div style={{textAlign:"center",padding:30,color:"rgba(255,255,255,.2)",fontSize:".82rem"}}>No foods found. Add your own!</div>}

          {/* Add Custom */}
          <div style={{padding:"14px 20px 0"}}>
            <button onClick={()=>setShowAddCustom(true)} style={{
              width:"100%",background:"rgba(255,255,255,.03)",border:"1.5px dashed rgba(234,179,8,.25)",
              borderRadius:14,padding:"13px",color:"#eab308",fontSize:".85rem",fontWeight:700,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            }}>＋ Add Custom Food / Brand</button>
            <p style={{textAlign:"center",fontSize:".62rem",color:"rgba(255,255,255,.18)",marginTop:5}}>Help build India's protein database</p>
          </div>
        </>
      ):activeTab==="tips"?(
        <TipsSection/>
      ):(
        /* ===== COMMUNITY TAB ===== */
        <div style={{padding:"4px 20px 0"}}>
          {/* Hero */}
          <div style={{textAlign:"center",padding:"16px 0 20px"}}>
            <div style={{fontSize:"2.5rem",marginBottom:8}}>🇮🇳</div>
            <h3 style={{fontSize:"1.4rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif",lineHeight:1.1}}>Join India's Protein Movement</h3>
            <p style={{fontSize:".82rem",color:"rgba(255,255,255,.45)",marginTop:8,lineHeight:1.5}}>
              A community of people helping their families eat more protein. Share tips, recipes, wins — and help us build a better tracker.
            </p>
          </div>

          {/* Telegram — Main CTA */}
          <a href="https://t.me/protein_hi_protein" target="_blank" rel="noopener noreferrer" style={{
            display:"flex",alignItems:"center",gap:14,
            background:"rgba(0,136,204,.1)",border:"2px solid rgba(0,136,204,.35)",
            borderRadius:18,padding:"20px 18px",textDecoration:"none",marginBottom:20,
          }}>
            <div style={{fontSize:"2.4rem",flexShrink:0}}>✈️</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"1rem",fontWeight:800,color:"#0088cc"}}>Join us on Telegram</div>
              <div style={{fontSize:".75rem",color:"rgba(255,255,255,.4)",marginTop:4,lineHeight:1.4}}>Weekly meal plans, protein hacks, brand reviews, community challenges. Free forever.</div>
            </div>
            <div style={{fontSize:"1.3rem",color:"rgba(0,136,204,.5)"}}>→</div>
          </a>

          {/* Email capture */}
          <div style={{background:"rgba(234,179,8,.06)",border:"1px solid rgba(234,179,8,.15)",borderRadius:16,padding:"18px",marginBottom:16}}>
            <h4 style={{fontSize:".95rem",fontWeight:700,color:"#eab308",marginBottom:4}}>🔔 Get Weekly Protein Plans</h4>
            <p style={{fontSize:".72rem",color:"rgba(255,255,255,.35)",marginBottom:14,lineHeight:1.5}}>
              Coming Soon. Free 7-day high-protein Indian meal plan delivered to your inbox every Monday. No spam, unsubscribe anytime.
            </p>
            {emailSubmitted?(
              <div style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:"12px",textAlign:"center"}}>
                <span style={{fontSize:".88rem",color:"#22c55e",fontWeight:700}}>✅ You're in! Check your inbox Monday. Coming Soon.</span>
              </div>
            ):(
              <div style={{display:"flex",gap:8}}>
                <input
                  type="email" placeholder="your@email.com" value={communityEmail}
                  onChange={e=>setCommunityEmail(e.target.value)}
                  style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:".88rem",outline:"none"}}
                />
                <button onClick={()=>{
                  if(!communityEmail||!communityEmail.includes("@"))return;
                  // Store email in persistent storage for collection
                  saveStorage("pkh-emails",JSON.stringify({email:communityEmail,name:profileName,date:new Date().toISOString()}));
                  saveStorage("pkh-email-submitted",true);
                  setEmailSubmitted(true);
                  setToast("Welcome aboard! 🎉");
                  setTimeout(()=>setToast(""),3000);
                }} style={{
                  background:"#eab308",border:"none",borderRadius:12,padding:"0 20px",
                  color:"#000",fontSize:".88rem",fontWeight:800,cursor:"pointer",
                  opacity:(!communityEmail||!communityEmail.includes("@"))?.4:1,
                  flexShrink:0,
                }}>Join</button>
              </div>
            )}
          </div>

          {/* Social proof / stats */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <div style={{flex:1,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"1.5rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif"}}>80+</div>
              <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)"}}>Desi Foods</div>
            </div>
            <div style={{flex:1,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"1.5rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif"}}>12+</div>
              <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)"}}>Indian Brands</div>
            </div>
            <div style={{flex:1,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"1.5rem",fontWeight:800,color:"#eab308",fontFamily:"'Teko',sans-serif"}}>100%</div>
              <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)"}}>Free</div>
            </div>
          </div>

          {/* Feedback */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"16px",textAlign:"center"}}>
            <p style={{fontSize:".78rem",color:"rgba(255,255,255,.35)",lineHeight:1.5}}>
              Got feedback? Want a feature? Found a bug?
            </p>
            <a href="https://t.me/protein_ka_chakkar" target="_blank" rel="noopener noreferrer" style={{fontSize:".82rem",color:"#0088cc",fontWeight:700,textDecoration:"none",display:"inline-block",marginTop:8}}>
              ✈️ Tell us on Telegram
            </a>
          </div>
        </div>
      )}

      {/* Share FAB */}
      {totalItems>0&&(
        <div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:100}}>
          <button onClick={()=>setShowShare(true)} style={{
            background:"#eab308",color:"#000",border:"none",borderRadius:20,
            padding:"12px 24px",fontSize:".9rem",fontWeight:800,cursor:"pointer",
            boxShadow:"0 4px 24px rgba(234,179,8,.4)",display:"flex",alignItems:"center",gap:8,
          }}>📤 Share Score</button>
        </div>
      )}

      {/* Modals */}
      {showShare&&(
        <div onClick={()=>setShowShare(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
          <div onClick={e=>e.stopPropagation()}><ShareCard current={totalProtein} target={targetProtein} mealData={mealData} allFoods={allFoods}/></div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <button onClick={handleShare} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:14,padding:"11px 24px",fontSize:".85rem",fontWeight:700,cursor:"pointer"}}>WhatsApp 💬</button>
            <button onClick={()=>setShowShare(false)} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"none",borderRadius:14,padding:"11px 16px",fontSize:".85rem",cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}
      {showAddCustom&&<AddCustomModal onAdd={addCustomFood} onClose={()=>setShowAddCustom(false)}/>}
      {showCalc&&<ProteinCalcModal onClose={()=>setShowCalc(false)} onSetTarget={t=>{setTargetProtein(t);saveProfile(profileName,t);setToast("Target set to "+t+"g/day ✅");setTimeout(()=>setToast(""),3000);}}/>}
      {showHistory&&<HistoryView history={history} target={targetProtein} allFoods={allFoods} onClose={()=>setShowHistory(false)}/>}
    </div>
  );
}
