// Har key ke liye 4 languages: en (English), hi (हिन्दी), bn (বাংলা), ta (தமிழ்)
// Naya text add karna ho to yahan key add karo, aur component mein t('key') use karo.
export const strings = {
  updatedJustNow: {
    en: 'Updated just now',
    hi: 'अभी अपडेट हुआ',
    bn: 'এইমাত্র আপডেট হয়েছে',
    ta: 'இப்போதுதான் புதுப்பிக்கப்பட்டது',
  },
  // {n} ki jagah minutes aate hain
  updatedMinAgo: {
    en: 'Updated {n} min ago',
    hi: '{n} मिनट पहले अपडेट हुआ',
    bn: '{n} মিনিট আগে আপডেট হয়েছে',
    ta: '{n} நிமிடங்களுக்கு முன் புதுப்பிக்கப்பட்டது',
  },
  tagline: {
    en: "Bringing India's forgotten heritage back to life",
    hi: 'भारत की भूली-बिसरी विरासत को फिर से जीवन देना',
    bn: 'ভারতের ভুলে যাওয়া ঐতিহ্যকে আবার জীবন্ত করা',
    ta: 'இந்தியாவின் மறக்கப்பட்ட பாரம்பரியத்தை மீண்டும் உயிர்ப்பித்தல்',
  },
  demoMode: {
    en: 'Demo mode',
    hi: 'डेमो मोड',
    bn: 'ডেমো মোড',
    ta: 'டெமோ பயன்முறை',
  },

  // Stats
  totalPlaces: {
    en: 'Total places',
    hi: 'कुल स्थान',
    bn: 'মোট স্থান',
    ta: 'மொத்த இடங்கள்',
  },
  verified: {
    en: 'Verified',
    hi: 'सत्यापित',
    bn: 'যাচাইকৃত',
    ta: 'சரிபார்க்கப்பட்டது',
  },
  unknown: {
    en: 'Unknown',
    hi: 'अज्ञात',
    bn: 'অজানা',
    ta: 'தெரியாதவை',
  },

  // Search and filter
  searchPlaceholder: {
    en: 'Search by name, state or type...',
    hi: 'नाम, राज्य या प्रकार से खोजें...',
    bn: 'নাম, রাজ্য বা ধরন দিয়ে খুঁজুন...',
    ta: 'பெயர், மாநிலம் அல்லது வகையால் தேடுங்கள்...',
  },
  filterAll: {
    en: 'All',
    hi: 'सभी',
    bn: 'সব',
    ta: 'அனைத்தும்',
  },
  typeBaoli: {
    en: 'Baoli',
    hi: 'बावड़ी',
    bn: 'বাওলি',
    ta: 'பாவ்லி',
  },
  typeFort: {
    en: 'Fort',
    hi: 'किला',
    bn: 'দুর্গ',
    ta: 'கோட்டை',
  },
  typeTemple: {
    en: 'Temple',
    hi: 'मंदिर',
    bn: 'মন্দির',
    ta: 'கோயில்',
  },
  typeOther: {
    en: 'Other',
    hi: 'अन्य',
    bn: 'অন্যান্য',
    ta: 'மற்றவை',
  },
  noPlacesFound: {
    en: 'No places found',
    hi: 'कोई स्थान नहीं मिला',
    bn: 'কোনো স্থান পাওয়া যায়নি',
    ta: 'இடங்கள் எதுவும் கிடைக்கவில்லை',
  },

  // Map and app-level messages
  loadingMap: {
    en: 'Loading map...',
    hi: 'नक्शा लोड हो रहा है...',
    bn: 'মানচিত্র লোড হচ্ছে...',
    ta: 'வரைபடம் ஏற்றப்படுகிறது...',
  },
  noPlacesYet: {
    en: 'No places found yet. Upload the first photo!',
    hi: 'अभी तक कोई स्थान नहीं मिला। पहली फ़ोटो अपलोड करें!',
    bn: 'এখনও কোনো স্থান নেই। প্রথম ছবি আপলোড করুন!',
    ta: 'இன்னும் இடங்கள் இல்லை. முதல் படத்தைப் பதிவேற்றுங்கள்!',
  },
  backendDown: {
    en: 'Backend is not running. Start the server, or set VITE_USE_MOCK=true in .env to view the demo.',
    hi: 'बैकएंड चालू नहीं है। सर्वर शुरू करें, या डेमो देखने के लिए .env में VITE_USE_MOCK=true सेट करें।',
    bn: 'ব্যাকএন্ড চালু নেই। সার্ভার চালু করুন, অথবা ডেমো দেখতে .env-এ VITE_USE_MOCK=true সেট করুন।',
    ta: 'பின்தளம் இயங்கவில்லை. சர்வரைத் தொடங்குங்கள், அல்லது டெமோவைக் காண .env-இல் VITE_USE_MOCK=true அமைக்கவும்.',
  },
  tryAgain: {
    en: 'Try again',
    hi: 'फिर से कोशिश करें',
    bn: 'আবার চেষ্টা করুন',
    ta: 'மீண்டும் முயற்சிக்கவும்',
  },
  pickHint: {
    en: 'Click on the map to choose a location',
    hi: 'स्थान चुनने के लिए नक्शे पर क्लिक करें',
    bn: 'অবস্থান বাছাই করতে মানচিত্রে ক্লিক করুন',
    ta: 'இருப்பிடத்தைத் தேர்ந்தெடுக்க வரைபடத்தில் கிளிக் செய்யவும்',
  },

  // Place detail
  close: {
    en: 'Close',
    hi: 'बंद करें',
    bn: 'বন্ধ করুন',
    ta: 'மூடு',
  },
  unknownStatus: {
    en: 'Unknown – help needed',
    hi: 'अज्ञात – मदद चाहिए',
    bn: 'অজানা – সাহায্য প্রয়োজন',
    ta: 'தெரியாதது – உதவி தேவை',
  },
  stateUnknown: {
    en: 'State unknown',
    hi: 'राज्य अज्ञात',
    bn: 'রাজ্য অজানা',
    ta: 'மாநிலம் தெரியவில்லை',
  },
  aiInfo: {
    en: 'AI information',
    hi: 'AI जानकारी',
    bn: 'AI তথ্য',
    ta: 'AI தகவல்',
  },
  translation: {
    en: 'Translation',
    hi: 'अनुवाद',
    bn: 'অনুবাদ',
    ta: 'மொழிபெயர்ப்பு',
  },
  communityStory: {
    en: 'Community story',
    hi: 'समुदाय की कहानी',
    bn: 'সম্প্রদায়ের গল্প',
    ta: 'சமூகக் கதை',
  },
  noInfo: {
    en: 'No information about this place yet.',
    hi: 'इस स्थान की अभी कोई जानकारी नहीं है।',
    bn: 'এই স্থান সম্পর্কে এখনও কোনো তথ্য নেই।',
    ta: 'இந்த இடம் பற்றிய தகவல் இன்னும் இல்லை.',
  },
  addInfo: {
    en: 'Add info',
    hi: 'जानकारी जोड़ें',
    bn: 'তথ্য যোগ করুন',
    ta: 'தகவல் சேர்க்கவும்',
  },
  placeNamePlaceholder: {
    en: 'Place name',
    hi: 'स्थान का नाम',
    bn: 'স্থানের নাম',
    ta: 'இடத்தின் பெயர்',
  },
  storyPlaceholder: {
    en: 'Its story, history, or anything you know...',
    hi: 'इसकी कहानी, इतिहास, या जो भी आप जानते हैं...',
    bn: 'এর গল্প, ইতিহাস, বা আপনি যা জানেন...',
    ta: 'இதன் கதை, வரலாறு, அல்லது நீங்கள் அறிந்தவை...',
  },
  saving: {
    en: 'Saving...',
    hi: 'सेव हो रहा है...',
    bn: 'সংরক্ষণ হচ্ছে...',
    ta: 'சேமிக்கப்படுகிறது...',
  },
  save: {
    en: 'Save',
    hi: 'सेव करें',
    bn: 'সংরক্ষণ করুন',
    ta: 'சேமி',
  },
  cancel: {
    en: 'Cancel',
    hi: 'रद्द करें',
    bn: 'বাতিল',
    ta: 'ரத்துசெய்',
  },
  nameRequired: {
    en: 'Place name is required',
    hi: 'स्थान का नाम ज़रूरी है',
    bn: 'স্থানের নাম আবশ্যক',
    ta: 'இடத்தின் பெயர் அவசியம்',
  },
  saveFailed: {
    en: 'Could not save. Please check the backend.',
    hi: 'सेव नहीं हो सका। बैकएंड जाँचें।',
    bn: 'সংরক্ষণ করা যায়নি। ব্যাকএন্ড দেখুন।',
    ta: 'சேமிக்க முடியவில்லை. பின்தளத்தைச் சரிபார்க்கவும்.',
  },

  // Upload panel
  uploadTitle: {
    en: 'Upload a heritage photo or document',
    hi: 'विरासत की फ़ोटो या दस्तावेज़ अपलोड करें',
    bn: 'ঐতিহ্যের ছবি বা নথি আপলোড করুন',
    ta: 'பாரம்பரிய படம் அல்லது ஆவணத்தைப் பதிவேற்றுங்கள்',
  },
  placePhoto: {
    en: 'Place photo',
    hi: 'स्थान की फ़ोटो',
    bn: 'স্থানের ছবি',
    ta: 'இடத்தின் படம்',
  },
  oldDocument: {
    en: 'Old document',
    hi: 'पुराना दस्तावेज़',
    bn: 'পুরনো নথি',
    ta: 'பழைய ஆவணம்',
  },
  choosePhoto: {
    en: 'Tap to choose a photo',
    hi: 'फ़ोटो चुनने के लिए टैप करें',
    bn: 'ছবি বাছাই করতে ট্যাপ করুন',
    ta: 'படத்தைத் தேர்ந்தெடுக்க தட்டவும்',
  },
  previewAlt: {
    en: 'Preview',
    hi: 'पूर्वावलोकन',
    bn: 'পূর্বরূপ',
    ta: 'முன்னோட்டம்',
  },
  readingGps: {
    en: 'Reading GPS from photo...',
    hi: 'फ़ोटो से GPS पढ़ा जा रहा है...',
    bn: 'ছবি থেকে GPS পড়া হচ্ছে...',
    ta: 'படத்திலிருந்து GPS படிக்கப்படுகிறது...',
  },
  gpsFound: {
    en: 'GPS found in photo ✅',
    hi: 'फ़ोटो में GPS मिला ✅',
    bn: 'ছবিতে GPS পাওয়া গেছে ✅',
    ta: 'படத்தில் GPS கிடைத்தது ✅',
  },
  noGps: {
    en: 'No GPS in this photo. Click on the map to choose a location.',
    hi: 'इस फ़ोटो में GPS नहीं है। स्थान चुनने के लिए नक्शे पर क्लिक करें।',
    bn: 'এই ছবিতে GPS নেই। অবস্থান বাছাই করতে মানচিত্রে ক্লিক করুন।',
    ta: 'இந்தப் படத்தில் GPS இல்லை. இருப்பிடத்தைத் தேர்ந்தெடுக்க வரைபடத்தில் கிளிக் செய்யவும்.',
  },
  gpsError: {
    en: 'Could not read GPS. Choose a location on the map.',
    hi: 'GPS नहीं पढ़ा जा सका। नक्शे पर स्थान चुनें।',
    bn: 'GPS পড়া যায়নি। মানচিত্রে অবস্থান বাছাই করুন।',
    ta: 'GPS ஐப் படிக்க முடியவில்லை. வரைபடத்தில் இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்.',
  },
  locationOptional: {
    en: 'Location is optional',
    hi: 'लोकेशन वैकल्पिक है',
    bn: 'অবস্থান ঐচ্ছিক',
    ta: 'இருப்பிடம் விருப்பத்தேர்வு',
  },
  noLocation: {
    en: 'No location yet',
    hi: 'अभी लोकेशन नहीं है',
    bn: 'এখনও অবস্থান নেই',
    ta: 'இன்னும் இருப்பிடம் இல்லை',
  },
  pickOnMap: {
    en: 'Pick on map',
    hi: 'नक्शे पर चुनें',
    bn: 'মানচিত্রে বাছাই করুন',
    ta: 'வரைபடத்தில் தேர்ந்தெடுக்கவும்',
  },
  needLocation: {
    en: 'A location is needed for place photos (GPS or map click)',
    hi: 'स्थान की फ़ोटो के लिए लोकेशन चाहिए (GPS या नक्शे पर क्लिक)',
    bn: 'স্থানের ছবির জন্য অবস্থান প্রয়োজন (GPS বা মানচিত্রে ক্লিক)',
    ta: 'இடப் படங்களுக்கு இருப்பிடம் தேவை (GPS அல்லது வரைபட கிளிக்)',
  },
  identify: {
    en: 'Identify',
    hi: 'पहचानें',
    bn: 'শনাক্ত করুন',
    ta: 'அடையாளம் காணுங்கள்',
  },
  pleaseWait: {
    en: 'Please wait...',
    hi: 'कृपया प्रतीक्षा करें...',
    bn: 'অপেক্ষা করুন...',
    ta: 'தயவுசெய்து காத்திருங்கள்...',
  },
  aiReading: {
    en: 'AI is reading...',
    hi: 'AI पढ़ रहा है...',
    bn: 'AI পড়ছে...',
    ta: 'AI படித்துக்கொண்டிருக்கிறது...',
  },
  aiError: {
    en: 'AI could not check this. Make sure the backend is running.',
    hi: 'AI इसकी जाँच नहीं कर सका। सुनिश्चित करें कि बैकएंड चालू है।',
    bn: 'AI এটি যাচাই করতে পারেনি। ব্যাকএন্ড চালু আছে কিনা দেখুন।',
    ta: 'AI இதைச் சரிபார்க்க முடியவில்லை. பின்தளம் இயங்குகிறதா எனப் பார்க்கவும்.',
  },
  sourceDatabase: {
    en: 'Found in our archive',
    hi: 'हमारे संग्रह में मिला',
    bn: 'আমাদের সংগ্রহে পাওয়া গেছে',
    ta: 'எங்கள் காப்பகத்தில் கிடைத்தது',
  },
  sourceGemini: {
    en: 'Identified by AI',
    hi: 'AI ने पहचाना',
    bn: 'AI শনাক্ত করেছে',
    ta: 'AI அடையாளம் கண்டது',
  },
  sourceUnknown: {
    en: 'Unknown – help us!',
    hi: 'अज्ञात – हमारी मदद करें!',
    bn: 'অজানা – আমাদের সাহায্য করুন!',
    ta: 'தெரியாதது – எங்களுக்கு உதவுங்கள்!',
  },
  openPinHint: {
    en: 'Open this pin on the map and click "Add info".',
    hi: 'नक्शे पर इस पिन को खोलें और "जानकारी जोड़ें" दबाएँ।',
    bn: 'মানচিত্রে এই পিনটি খুলে "তথ্য যোগ করুন" চাপুন।',
    ta: 'வரைபடத்தில் இந்த முள்ளைத் திறந்து "தகவல் சேர்க்கவும்" என்பதை அழுத்தவும்.',
  },
}
