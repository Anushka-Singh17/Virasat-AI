// Seed script: npm run seed
// 40 heritage sites (har region se) database mein daalta hai.
// Naam se check karta hai, isliye dobara chalane par duplicate nahi bante aur user ka data nahi badalta.
require("dotenv").config();
const mongoose = require("mongoose");
const Place = require("./models/Place");

// Coordinates lagbhag sahi hain. Production se pehle Google Maps par verify kar lena.
// status: "verified" = pakki jaankari, "anjaan" = kam-mashhoor jagah jiski jaankari abhi nahi hai
const sites = [
  // North
  { naam: "Red Fort", lat: 28.6562, lng: 77.241, type: "kila", state: "Delhi", status: "verified", history: "Shah Jahan ne 17th century mein banwaya; Mughal kaal ka mukhya kila." },
  { naam: "Qutb Minar", lat: 28.5245, lng: 77.1855, type: "other", state: "Delhi", status: "verified", history: "1193 mein Qutb-ud-din Aibak ne shuru karaya." },
  { naam: "Humayun's Tomb", lat: 28.5933, lng: 77.2507, type: "other", state: "Delhi", status: "verified", history: "Mughal samrat Humayun ka maqbara, 16th century mein bana." },
  { naam: "Agrasen ki Baoli", lat: 28.6257, lng: 77.2295, type: "baoli", state: "Delhi", status: "verified", history: "Connaught Place ke paas ki purani stepwell." },
  { naam: "Hawa Mahal", lat: 26.9239, lng: 75.8267, type: "other", state: "Rajasthan", status: "verified", history: "1799 mein Maharaja Sawai Pratap Singh ne banwaya." },
  { naam: "Amber Fort", lat: 26.9855, lng: 75.8513, type: "kila", state: "Rajasthan", status: "verified", history: "Kachhwaha Rajputon ka kila-mahal, Jaipur ke paas." },
  { naam: "Jantar Mantar Jaipur", lat: 26.9248, lng: 75.8246, type: "other", state: "Rajasthan", status: "verified", history: "1728 mein Sawai Jai Singh II ne banwaya; khagol vigyan ki pathar ki yantra-shala." },
  { naam: "Mehrangarh Fort", lat: 26.2978, lng: 73.0185, type: "kila", state: "Rajasthan", status: "verified", history: "1459 mein Rao Jodha ne shuru karaya; Jodhpur ki pahadi par." },
  { naam: "Chittorgarh Fort", lat: 24.8887, lng: 74.6269, type: "kila", state: "Rajasthan", status: "verified", history: "Mewar ki purani rajdhani; jauhar aur shaurya ki kahaniyon ke liye mashhoor." },
  { naam: "Taj Mahal", lat: 27.1751, lng: 78.0421, type: "other", state: "Uttar Pradesh", status: "verified", history: "Shah Jahan ne Mumtaz Mahal ki yaad mein 17th century mein banwaya." },
  { naam: "Agra Fort", lat: 27.1795, lng: 78.0211, type: "kila", state: "Uttar Pradesh", status: "verified", history: "Mughal kila, Akbar ke samay se jud hai." },
  { naam: "Golden Temple", lat: 31.62, lng: 74.8765, type: "mandir", state: "Punjab", status: "verified", history: "Sikh dharm ka sabse pavitra gurudwara, Harmandir Sahib bhi kehlata hai." },

  // West
  { naam: "Rani ki Vav", lat: 23.8588, lng: 72.1019, type: "baoli", state: "Gujarat", status: "verified", history: "11th century ki stepwell, UNESCO World Heritage Site (2014)." },
  { naam: "Modhera Sun Temple", lat: 23.5833, lng: 72.1333, type: "mandir", state: "Gujarat", status: "verified", history: "11th century ka Solanki kaal ka surya mandir." },
  { naam: "Gateway of India", lat: 18.922, lng: 72.8347, type: "other", state: "Maharashtra", status: "verified", history: "1911 mein King George V ke Bharat aagman ki yaad mein; 1924 mein poora hua." },
  { naam: "Elephanta Caves", lat: 18.9633, lng: 72.9315, type: "mandir", state: "Maharashtra", status: "verified", history: "Shiv ko samarpit pahadi gufayein, Mumbai ke paas." },
  { naam: "Ajanta Caves", lat: 20.5519, lng: 75.7033, type: "other", state: "Maharashtra", status: "verified", history: "Bauddh gufayein, lagbhag 2nd century BCE se 6th century CE tak; UNESCO site." },
  { naam: "Ellora Caves", lat: 20.0269, lng: 75.1791, type: "other", state: "Maharashtra", status: "verified", history: "Bauddh, Hindu aur Jain gufayein; Kailasa mandir ek hi pathar se bana." },
  { naam: "Shaniwar Wada", lat: 18.5195, lng: 73.8553, type: "kila", state: "Maharashtra", status: "verified", history: "1732 mein Peshwa Bajirao I ne banwaya, Pune mein." },

  // Central
  { naam: "Sanchi Stupa", lat: 23.4793, lng: 77.7398, type: "other", state: "Madhya Pradesh", status: "verified", history: "Samrat Ashoka ke samay ka bauddh stupa, 3rd century BCE." },
  { naam: "Khajuraho Temples", lat: 24.8318, lng: 79.9199, type: "mandir", state: "Madhya Pradesh", status: "verified", history: "Chandela kaal ke mandir, apni nakkashi ke liye UNESCO site." },
  { naam: "Gwalior Fort", lat: 26.23, lng: 78.1729, type: "kila", state: "Madhya Pradesh", status: "verified", history: "Pahadi par bana kila, Man Mandir Palace ke liye mashhoor." },
  { naam: "Bhimbetka Rock Shelters", lat: 22.938, lng: 77.613, type: "other", state: "Madhya Pradesh", status: "anjaan", history: "" },

  // South
  { naam: "Golconda Fort", lat: 17.3833, lng: 78.4011, type: "kila", state: "Telangana", status: "verified", history: "Qutb Shahi vanshon ka kila, apni acoustics ke liye jana jaata hai." },
  { naam: "Charminar", lat: 17.3616, lng: 78.4747, type: "other", state: "Telangana", status: "verified", history: "1591 mein Muhammad Quli Qutb Shah ne banwaya, Hyderabad mein." },
  { naam: "Brihadeeswara Temple", lat: 10.7828, lng: 79.1318, type: "mandir", state: "Tamil Nadu", status: "verified", history: "11th century mein Raja Raja Chola I ne banwaya; UNESCO site." },
  { naam: "Meenakshi Amman Temple", lat: 9.9195, lng: 78.1193, type: "mandir", state: "Tamil Nadu", status: "verified", history: "Madurai ka mandir, Devi Meenakshi aur Shiv ko samarpit." },
  { naam: "Mahabalipuram Shore Temple", lat: 12.616, lng: 80.199, type: "mandir", state: "Tamil Nadu", status: "verified", history: "7th century ke Pallava kaal ka mandir, samundar ke kinare." },
  { naam: "Hampi Vittala Temple", lat: 15.3481, lng: 76.474, type: "mandir", state: "Karnataka", status: "verified", history: "Vijayanagara samrajya ki rajdhani; pathar ka ratha yahan ka mashhoor hissa hai." },
  { naam: "Mysore Palace", lat: 12.3052, lng: 76.6552, type: "other", state: "Karnataka", status: "verified", history: "Wodeyar vansh ka mahal, 1912 mein poora hua." },

  // East
  { naam: "Konark Sun Temple", lat: 19.8876, lng: 86.0945, type: "mandir", state: "Odisha", status: "verified", history: "13th century mein Narasimhadeva I ne banwaya, sun ke rath ke roop mein." },
  { naam: "Jagannath Temple Puri", lat: 19.8049, lng: 85.8179, type: "mandir", state: "Odisha", status: "verified", history: "12th century mein bana, Jagannath ko samarpit." },
  { naam: "Mahabodhi Temple", lat: 24.6961, lng: 84.9869, type: "mandir", state: "Bihar", status: "verified", history: "Bodh Gaya mein wahi jagah jahan Buddha ko gyan prapt hua." },
  { naam: "Nalanda University Ruins", lat: 25.135, lng: 85.4438, type: "other", state: "Bihar", status: "verified", history: "Prachin vishwavidyalaya ke khandhar, 5th century se." },
  { naam: "Kamakhya Temple", lat: 26.1665, lng: 91.7059, type: "mandir", state: "Assam", status: "verified", history: "Shakti peeth, Guwahati ki Nilachal pahadi par." },

  // Kam-mashhoor / gaon wali jagahein (anjaan)
  { naam: "Chand Baori", lat: 27.0, lng: 76.62, type: "baoli", state: "Rajasthan", status: "anjaan", history: "" },
  { naam: "Toorji ka Jhalra", lat: 26.2886, lng: 73.0241, type: "baoli", state: "Rajasthan", status: "anjaan", history: "" },
  { naam: "Kumbhalgarh Fort", lat: 25.1488, lng: 73.58, type: "kila", state: "Rajasthan", status: "anjaan", history: "" },
  { naam: "Jaisalmer Fort", lat: 26.9124, lng: 70.9126, type: "kila", state: "Rajasthan", status: "anjaan", history: "" },
  { naam: "Adalaj ki Vav", lat: 23.1652, lng: 72.5802, type: "baoli", state: "Gujarat", status: "anjaan", history: "" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected ✅");

  let added = 0;
  for (const site of sites) {
    // Naam se dhoondho: mil gaya to kuch nahi karna, nahi mila to naya banao
    const result = await Place.updateOne(
      { naam: site.naam },
      { $setOnInsert: site },
      { upsert: true }
    );
    if (result.upsertedCount === 1) added++;
  }

  console.log(`Seed complete: ${added} naye sthal add hue, total list ${sites.length}`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.log("Seed error ❌", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
