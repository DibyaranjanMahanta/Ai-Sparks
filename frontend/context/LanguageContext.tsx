import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages
export type LanguageCode = 'en' | 'hi' | 'od' | 'ta';

export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  od: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
};

// Complete translations
export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation & Common
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    tracks: 'Learning Tracks',
    quiz: 'Quiz',
    art_studio: 'AI Art Studio',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    badges: 'Badges',
    settings: 'Settings',
    home: 'Home',
    back: 'Back',
    
    // Auth
    get_started: 'Get Started',
    login: 'Log In',
    register: 'Create Account',
    logout: 'Log Out',
    already_account: 'Already have an account?',
    no_account: "Don't have an account?",
    sign_up: 'Sign Up',
    full_name: 'Full Name',
    email: 'Email',
    password: 'Password',
    enter_name: 'Enter your name',
    enter_email: 'your@email.com',
    enter_password: 'Enter password',
    fill_all_fields: 'Please fill all fields',
    
    // Roles
    i_am_a: 'I am a',
    student: 'Student',
    teacher: 'Teacher',
    parent: 'Parent',
    i_am_in: 'I am in',
    grade_6_8: 'Grade 6-8',
    grade_9_12: 'Grade 9-12',
    
    // Lessons
    lessons: 'Lessons',
    complete: 'Complete & Continue',
    completed: 'Completed',
    next_lesson: 'Next Lesson',
    track_complete: 'Track Complete!',
    lesson_complete: 'Lesson Complete!',
    in_progress: 'In Progress',
    start_learning: 'Start Learning',
    continue_learning: 'Continue Learning',
    
    // XP & Progress
    xp_earned: 'XP Earned',
    total_xp: 'Total XP',
    level: 'Level',
    xp_to_next: 'XP to next level',
    lessons_completed: 'Lessons Completed',
    quizzes_taken: 'Quizzes Taken',
    
    // Dashboard
    hey: 'Hey',
    back_dashboard: 'Back to Dashboard',
    quick_actions: 'Quick Actions',
    take_quiz: 'Take Quiz',
    ai_art: 'AI Art',
    ranks: 'Ranks',
    
    // Streak & Certificates
    streak: 'Day Streak',
    certificates: 'Certificates',
    my_certificates: 'My Certificates',
    view_certificate: 'View Certificate',
    
    // Olympiad
    olympiad: 'AI Olympiad',
    competition: 'Competition',
    join_olympiad: 'Join Olympiad',
    time_remaining: 'Time Remaining',
    submit: 'Submit',
    
    // Teacher/Parent
    teacher_dash: 'Teacher Dashboard',
    parent_dash: 'Parent Dashboard',
    my_students: 'My Students',
    my_child: "My Child's Progress",
    students: 'Students',
    active_today: 'Active Today',
    avg_xp: 'Avg XP',
    lessons_done: 'Lessons Done',
    student_progress: 'Student Progress',
    link_child: 'Link Child',
    child_email: "Child's email address",
    no_children_linked: 'No Children Linked',
    link_child_desc: "Tap the + button to link your child's account using their email.",
    recent_activity: 'Recent Activity',
    recent_quizzes: 'Recent Quiz Scores',
    last_7_days: 'Last 7 days',
    
    // Profile
    learning_progress: 'Learning Progress',
    my_badges: 'My Badges',
    
    // Language
    language: 'Language',
    select_language: 'Select Language',
    language_changed: 'Language changed successfully',
    
    // Art Studio
    create_ai_art: 'Create AI Art',
    enter_prompt: 'Enter your prompt...',
    generating: 'Generating...',
    generate: 'Generate',
    art_prompt_hint: 'Describe what you want to create',
    
    // Quiz
    select_track: 'Select Track',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    start_quiz: 'Start Quiz',
    questions: 'Questions',
    your_score: 'Your Score',
    correct_answers: 'Correct Answers',
    
    // Misc
    congratulations: 'Congratulations!',
    certificate_earned: 'You earned a certificate!',
    explore_more: 'Explore More Tracks',
    badges_earned: 'Badges Earned',
    no_students: 'No students registered yet',
    or: 'or',
    continue_with_google: 'Continue with Google',
    app_tagline: 'Learn AI. Create with AI. Shape the Future.',
    app_subtitle: "India's fun AI learning platform for school students",
    gamified: 'Gamified',
    safe: 'Safe',
    nep_2020: 'NEP 2020',
    join_ai_sparks: 'Join AI Sparks',
    welcome_back: 'Welcome Back!',
    start_adventure: 'Start your AI adventure today',
    continue_journey: 'Continue your AI learning journey',
  },
  hi: {
    // Navigation & Common
    welcome: 'स्वागत',
    dashboard: 'डैशबोर्ड',
    tracks: 'सीखने के ट्रैक',
    quiz: 'प्रश्नोत्तरी',
    art_studio: 'AI कला स्टूडियो',
    profile: 'प्रोफ़ाइल',
    leaderboard: 'लीडरबोर्ड',
    badges: 'बैज',
    settings: 'सेटिंग्स',
    home: 'होम',
    back: 'वापस',
    
    // Auth
    get_started: 'शुरू करें',
    login: 'लॉग इन',
    register: 'खाता बनाएं',
    logout: 'लॉग आउट',
    already_account: 'पहले से खाता है?',
    no_account: 'खाता नहीं है?',
    sign_up: 'साइन अप',
    full_name: 'पूरा नाम',
    email: 'ईमेल',
    password: 'पासवर्ड',
    enter_name: 'अपना नाम दर्ज करें',
    enter_email: 'your@email.com',
    enter_password: 'पासवर्ड दर्ज करें',
    fill_all_fields: 'कृपया सभी फ़ील्ड भरें',
    
    // Roles
    i_am_a: 'मैं हूं',
    student: 'छात्र',
    teacher: 'शिक्षक',
    parent: 'अभिभावक',
    i_am_in: 'मैं पढ़ता/पढ़ती हूं',
    grade_6_8: 'कक्षा 6-8',
    grade_9_12: 'कक्षा 9-12',
    
    // Lessons
    lessons: 'पाठ',
    complete: 'पूर्ण करें और आगे बढ़ें',
    completed: 'पूर्ण',
    next_lesson: 'अगला पाठ',
    track_complete: 'ट्रैक पूर्ण!',
    lesson_complete: 'पाठ पूर्ण!',
    in_progress: 'चल रहा',
    start_learning: 'सीखना शुरू करें',
    continue_learning: 'सीखना जारी रखें',
    
    // XP & Progress
    xp_earned: 'XP अर्जित',
    total_xp: 'कुल XP',
    level: 'स्तर',
    xp_to_next: 'अगले स्तर के लिए XP',
    lessons_completed: 'पूर्ण पाठ',
    quizzes_taken: 'प्रश्नोत्तरी',
    
    // Dashboard
    hey: 'नमस्ते',
    back_dashboard: 'डैशबोर्ड पर वापस',
    quick_actions: 'त्वरित कार्य',
    take_quiz: 'प्रश्नोत्तरी',
    ai_art: 'AI कला',
    ranks: 'रैंक',
    
    // Streak & Certificates
    streak: 'दिन की स्ट्रीक',
    certificates: 'प्रमाणपत्र',
    my_certificates: 'मेरे प्रमाणपत्र',
    view_certificate: 'प्रमाणपत्र देखें',
    
    // Olympiad
    olympiad: 'AI ओलंपियाड',
    competition: 'प्रतियोगिता',
    join_olympiad: 'ओलंपियाड में शामिल हों',
    time_remaining: 'शेष समय',
    submit: 'जमा करें',
    
    // Teacher/Parent
    teacher_dash: 'शिक्षक डैशबोर्ड',
    parent_dash: 'अभिभावक डैशबोर्ड',
    my_students: 'मेरे छात्र',
    my_child: 'मेरे बच्चे की प्रगति',
    students: 'छात्र',
    active_today: 'आज सक्रिय',
    avg_xp: 'औसत XP',
    lessons_done: 'पूर्ण पाठ',
    student_progress: 'छात्र प्रगति',
    link_child: 'बच्चे को जोड़ें',
    child_email: 'बच्चे का ईमेल',
    no_children_linked: 'कोई बच्चा नहीं जुड़ा',
    link_child_desc: 'बच्चे के खाते को जोड़ने के लिए + बटन दबाएं।',
    recent_activity: 'हाल की गतिविधि',
    recent_quizzes: 'हाल के प्रश्नोत्तरी स्कोर',
    last_7_days: 'पिछले 7 दिन',
    
    // Profile
    learning_progress: 'सीखने की प्रगति',
    my_badges: 'मेरे बैज',
    
    // Language
    language: 'भाषा',
    select_language: 'भाषा चुनें',
    language_changed: 'भाषा सफलतापूर्वक बदल गई',
    
    // Art Studio
    create_ai_art: 'AI कला बनाएं',
    enter_prompt: 'अपना प्रॉम्प्ट दर्ज करें...',
    generating: 'बना रहा है...',
    generate: 'बनाएं',
    art_prompt_hint: 'वर्णन करें कि आप क्या बनाना चाहते हैं',
    
    // Quiz
    select_track: 'ट्रैक चुनें',
    difficulty: 'कठिनाई',
    easy: 'आसान',
    medium: 'मध्यम',
    hard: 'कठिन',
    start_quiz: 'प्रश्नोत्तरी शुरू करें',
    questions: 'प्रश्न',
    your_score: 'आपका स्कोर',
    correct_answers: 'सही उत्तर',
    
    // Misc
    congratulations: 'बधाई हो!',
    certificate_earned: 'आपने प्रमाणपत्र अर्जित किया!',
    explore_more: 'और ट्रैक देखें',
    badges_earned: 'अर्जित बैज',
    no_students: 'अभी तक कोई छात्र पंजीकृत नहीं',
    or: 'या',
    continue_with_google: 'Google से जारी रखें',
    app_tagline: 'AI सीखें। AI से बनाएं। भविष्य को आकार दें।',
    app_subtitle: 'भारत का मज़ेदार AI सीखने का प्लेटफॉर्म',
    gamified: 'गेमिफाइड',
    safe: 'सुरक्षित',
    nep_2020: 'NEP 2020',
    join_ai_sparks: 'AI Sparks से जुड़ें',
    welcome_back: 'वापसी पर स्वागत!',
    start_adventure: 'आज ही AI साहसिक यात्रा शुरू करें',
    continue_journey: 'AI सीखने की यात्रा जारी रखें',
  },
  od: {
    // Navigation & Common
    welcome: 'ସ୍ୱାଗତ',
    dashboard: 'ଡ୍ୟାସବୋର୍ଡ',
    tracks: 'ଶିକ୍ଷଣ ଟ୍ରାକ',
    quiz: 'କ୍ୱିଜ',
    art_studio: 'AI କଳା ଷ୍ଟୁଡିଓ',
    profile: 'ପ୍ରୋଫାଇଲ',
    leaderboard: 'ଲିଡରବୋର୍ଡ',
    badges: 'ବ୍ୟାଜ',
    settings: 'ସେଟିଂସ',
    home: 'ହୋମ',
    back: 'ପଛକୁ',
    
    // Auth
    get_started: 'ଆରମ୍ଭ କରନ୍ତୁ',
    login: 'ଲଗ ଇନ',
    register: 'ଆକାଉଣ୍ଟ ତିଆରି',
    logout: 'ଲଗ ଆଉଟ',
    already_account: 'ପୂର୍ବରୁ ଆକାଉଣ୍ଟ ଅଛି?',
    no_account: 'ଆକାଉଣ୍ଟ ନାହିଁ?',
    sign_up: 'ସାଇନ ଅପ',
    full_name: 'ପୂରା ନାମ',
    email: 'ଇମେଲ',
    password: 'ପାସୱାର୍ଡ',
    enter_name: 'ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ',
    enter_email: 'your@email.com',
    enter_password: 'ପାସୱାର୍ଡ ଲେଖନ୍ତୁ',
    fill_all_fields: 'ଦୟାକରି ସମସ୍ତ ଫିଲ୍ଡ ପୁରଣ କରନ୍ତୁ',
    
    // Roles
    i_am_a: 'ମୁଁ ହେଉଛି',
    student: 'ଛାତ୍ର',
    teacher: 'ଶିକ୍ଷକ',
    parent: 'ଅଭିଭାବକ',
    i_am_in: 'ମୁଁ ପଢ଼ୁଛି',
    grade_6_8: 'ଶ୍ରେଣୀ ୬-୮',
    grade_9_12: 'ଶ୍ରେଣୀ ୯-୧୨',
    
    // Lessons
    lessons: 'ପାଠ',
    complete: 'ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ ଏବଂ ଆଗକୁ ବଢ଼ନ୍ତୁ',
    completed: 'ସମ୍ପୂର୍ଣ୍ଣ',
    next_lesson: 'ପରବର୍ତ୍ତୀ ପାଠ',
    track_complete: 'ଟ୍ରାକ ସମ୍ପୂର୍ଣ୍ଣ!',
    lesson_complete: 'ପାଠ ସମ୍ପୂର୍ଣ୍ଣ!',
    in_progress: 'ଚାଲୁ ଅଛି',
    start_learning: 'ଶିକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ',
    continue_learning: 'ଶିକ୍ଷା ଜାରି ରଖନ୍ତୁ',
    
    // XP & Progress
    xp_earned: 'XP ଅର୍ଜିତ',
    total_xp: 'ମୋଟ XP',
    level: 'ସ୍ତର',
    xp_to_next: 'ପରବର୍ତ୍ତୀ ସ୍ତର ପାଇଁ XP',
    lessons_completed: 'ସମ୍ପୂର୍ଣ୍ଣ ପାଠ',
    quizzes_taken: 'କ୍ୱିଜ',
    
    // Dashboard
    hey: 'ହେଲୋ',
    back_dashboard: 'ଡ୍ୟାସବୋର୍ଡକୁ ଫେରନ୍ତୁ',
    quick_actions: 'ଦ୍ରୁତ କାର୍ଯ୍ୟ',
    take_quiz: 'କ୍ୱିଜ',
    ai_art: 'AI କଳା',
    ranks: 'ରାଙ୍କ',
    
    // Streak & Certificates
    streak: 'ଦିନ ଷ୍ଟ୍ରିକ',
    certificates: 'ପ୍ରମାଣପତ୍ର',
    my_certificates: 'ମୋ ପ୍ରମାଣପତ୍ର',
    view_certificate: 'ପ୍ରମାଣପତ୍ର ଦେଖନ୍ତୁ',
    
    // Olympiad
    olympiad: 'AI ଓଲମ୍ପିଆଡ',
    competition: 'ପ୍ରତିଯୋଗିତା',
    join_olympiad: 'ଓଲମ୍ପିଆଡରେ ଯୋଗ ଦିଅନ୍ତୁ',
    time_remaining: 'ବାକି ସମୟ',
    submit: 'ଦାଖଲ କରନ୍ତୁ',
    
    // Teacher/Parent
    teacher_dash: 'ଶିକ୍ଷକ ଡ୍ୟାସବୋର୍ଡ',
    parent_dash: 'ଅଭିଭାବକ ଡ୍ୟାସବୋର୍ଡ',
    my_students: 'ମୋ ଛାତ୍ର',
    my_child: 'ମୋ ପିଲାର ପ୍ରଗତି',
    students: 'ଛାତ୍ର',
    active_today: 'ଆଜି ସକ୍ରିୟ',
    avg_xp: 'ହାରାହାରି XP',
    lessons_done: 'ସମ୍ପୂର୍ଣ୍ଣ ପାଠ',
    student_progress: 'ଛାତ୍ର ପ୍ରଗତି',
    link_child: 'ପିଲାଙ୍କୁ ଯୋଡ଼ନ୍ତୁ',
    child_email: 'ପିଲାଙ୍କ ଇମେଲ',
    no_children_linked: 'କୌଣସି ପିଲା ଯୋଡ଼ା ହୋଇନାହିଁ',
    link_child_desc: 'ପିଲାଙ୍କ ଆକାଉଣ୍ଟ ଯୋଡ଼ିବାକୁ + ବଟନ ଦବାନ୍ତୁ।',
    recent_activity: 'ସାମ୍ପ୍ରତିକ ଗତିବିଧି',
    recent_quizzes: 'ସାମ୍ପ୍ରତିକ କ୍ୱିଜ ସ୍କୋର',
    last_7_days: 'ଗତ ୭ ଦିନ',
    
    // Profile
    learning_progress: 'ଶିକ୍ଷା ପ୍ରଗତି',
    my_badges: 'ମୋ ବ୍ୟାଜ',
    
    // Language
    language: 'ଭାଷା',
    select_language: 'ଭାଷା ବାଛନ୍ତୁ',
    language_changed: 'ଭାଷା ସଫଳତାର ସହ ବଦଳିଗଲା',
    
    // Art Studio
    create_ai_art: 'AI କଳା ତିଆରି କରନ୍ତୁ',
    enter_prompt: 'ଆପଣଙ୍କ ପ୍ରମ୍ପ୍ଟ ଲେଖନ୍ତୁ...',
    generating: 'ତିଆରି ହେଉଛି...',
    generate: 'ତିଆରି କରନ୍ତୁ',
    art_prompt_hint: 'ଆପଣ କଣ ତିଆରି କରିବାକୁ ଚାହୁଁଛନ୍ତି ବର୍ଣ୍ଣନା କରନ୍ତୁ',
    
    // Quiz
    select_track: 'ଟ୍ରାକ ବାଛନ୍ତୁ',
    difficulty: 'କଠିନତା',
    easy: 'ସହଜ',
    medium: 'ମଧ୍ୟମ',
    hard: 'କଠିନ',
    start_quiz: 'କ୍ୱିଜ ଆରମ୍ଭ କରନ୍ତୁ',
    questions: 'ପ୍ରଶ୍ନ',
    your_score: 'ଆପଣଙ୍କ ସ୍କୋର',
    correct_answers: 'ସଠିକ ଉତ୍ତର',
    
    // Misc
    congratulations: 'ଅଭିନନ୍ଦନ!',
    certificate_earned: 'ଆପଣ ପ୍ରମାଣପତ୍ର ପାଇଲେ!',
    explore_more: 'ଅଧିକ ଟ୍ରାକ ଦେଖନ୍ତୁ',
    badges_earned: 'ଅର୍ଜିତ ବ୍ୟାଜ',
    no_students: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଛାତ୍ର ପଞ୍ଜିକୃତ ନୁହେଁ',
    or: 'କିମ୍ବା',
    continue_with_google: 'Google ସହ ଜାରି ରଖନ୍ତୁ',
    app_tagline: 'AI ଶିଖନ୍ତୁ। AI ସହ ତିଆରି କରନ୍ତୁ। ଭବିଷ୍ୟତକୁ ଆକାର ଦିଅନ୍ତୁ।',
    app_subtitle: 'ଭାରତର ମଜାଦାର AI ଶିକ୍ଷା ପ୍ଲାଟଫର୍ମ',
    gamified: 'ଗେମିଫାଇଡ',
    safe: 'ସୁରକ୍ଷିତ',
    nep_2020: 'NEP 2020',
    join_ai_sparks: 'AI Sparks ରେ ଯୋଗ ଦିଅନ୍ତୁ',
    welcome_back: 'ଫେରିବାକୁ ସ୍ୱାଗତ!',
    start_adventure: 'ଆଜି AI ସାହସିକ ଯାତ୍ରା ଆରମ୍ଭ କରନ୍ତୁ',
    continue_journey: 'AI ଶିକ୍ଷା ଯାତ୍ରା ଜାରି ରଖନ୍ତୁ',
  },
  ta: {
    // Navigation & Common
    welcome: 'வரவேற்பு',
    dashboard: 'டாஷ்போர்டு',
    tracks: 'கற்றல் பாதைகள்',
    quiz: 'வினாடி வினா',
    art_studio: 'AI கலை ஸ்டுடியோ',
    profile: 'சுயவிவரம்',
    leaderboard: 'தரவரிசை',
    badges: 'பேட்ஜ்கள்',
    settings: 'அமைப்புகள்',
    home: 'முகப்பு',
    back: 'பின்செல்',
    
    // Auth
    get_started: 'தொடங்கு',
    login: 'உள்நுழை',
    register: 'கணக்கை உருவாக்கு',
    logout: 'வெளியேறு',
    already_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
    no_account: 'கணக்கு இல்லையா?',
    sign_up: 'பதிவு செய்',
    full_name: 'முழு பெயர்',
    email: 'மின்னஞ்சல்',
    password: 'கடவுச்சொல்',
    enter_name: 'உங்கள் பெயரை உள்ளிடவும்',
    enter_email: 'your@email.com',
    enter_password: 'கடவுச்சொல்லை உள்ளிடவும்',
    fill_all_fields: 'அனைத்து புலங்களையும் நிரப்பவும்',
    
    // Roles
    i_am_a: 'நான் ஒரு',
    student: 'மாணவர்',
    teacher: 'ஆசிரியர்',
    parent: 'பெற்றோர்',
    i_am_in: 'நான் படிக்கிறேன்',
    grade_6_8: 'வகுப்பு 6-8',
    grade_9_12: 'வகுப்பு 9-12',
    
    // Lessons
    lessons: 'பாடங்கள்',
    complete: 'முடித்து தொடரவும்',
    completed: 'முடிந்தது',
    next_lesson: 'அடுத்த பாடம்',
    track_complete: 'பாதை முடிந்தது!',
    lesson_complete: 'பாடம் முடிந்தது!',
    in_progress: 'நடந்து கொண்டிருக்கிறது',
    start_learning: 'கற்றல் தொடங்கு',
    continue_learning: 'கற்றல் தொடரவும்',
    
    // XP & Progress
    xp_earned: 'XP பெற்றது',
    total_xp: 'மொத்த XP',
    level: 'நிலை',
    xp_to_next: 'அடுத்த நிலைக்கு XP',
    lessons_completed: 'முடிக்கப்பட்ட பாடங்கள்',
    quizzes_taken: 'வினாடி வினா',
    
    // Dashboard
    hey: 'வணக்கம்',
    back_dashboard: 'டாஷ்போர்டுக்கு திரும்பு',
    quick_actions: 'விரைவு செயல்கள்',
    take_quiz: 'வினாடி வினா',
    ai_art: 'AI கலை',
    ranks: 'தரவரிசை',
    
    // Streak & Certificates
    streak: 'நாள் தொடர்',
    certificates: 'சான்றிதழ்கள்',
    my_certificates: 'என் சான்றிதழ்கள்',
    view_certificate: 'சான்றிதழ் பார்க்க',
    
    // Olympiad
    olympiad: 'AI ஒலிம்பியாட்',
    competition: 'போட்டி',
    join_olympiad: 'ஒலிம்பியாட்டில் சேரவும்',
    time_remaining: 'மீதமுள்ள நேரம்',
    submit: 'சமர்ப்பி',
    
    // Teacher/Parent
    teacher_dash: 'ஆசிரியர் டாஷ்போர்டு',
    parent_dash: 'பெற்றோர் டாஷ்போர்டு',
    my_students: 'என் மாணவர்கள்',
    my_child: 'என் குழந்தையின் முன்னேற்றம்',
    students: 'மாணவர்கள்',
    active_today: 'இன்று செயலில்',
    avg_xp: 'சராசரி XP',
    lessons_done: 'முடிந்த பாடங்கள்',
    student_progress: 'மாணவர் முன்னேற்றம்',
    link_child: 'குழந்தையை இணைக்கவும்',
    child_email: 'குழந்தையின் மின்னஞ்சல்',
    no_children_linked: 'குழந்தைகள் இணைக்கப்படவில்லை',
    link_child_desc: 'குழந்தையின் கணக்கை இணைக்க + பொத்தானை அழுத்தவும்.',
    recent_activity: 'சமீபத்திய செயல்பாடு',
    recent_quizzes: 'சமீபத்திய வினாடி வினா மதிப்பெண்கள்',
    last_7_days: 'கடந்த 7 நாட்கள்',
    
    // Profile
    learning_progress: 'கற்றல் முன்னேற்றம்',
    my_badges: 'என் பேட்ஜ்கள்',
    
    // Language
    language: 'மொழி',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    language_changed: 'மொழி வெற்றிகரமாக மாற்றப்பட்டது',
    
    // Art Studio
    create_ai_art: 'AI கலையை உருவாக்கு',
    enter_prompt: 'உங்கள் ப்ராம்ப்ட்டை உள்ளிடவும்...',
    generating: 'உருவாக்குகிறது...',
    generate: 'உருவாக்கு',
    art_prompt_hint: 'நீங்கள் என்ன உருவாக்க விரும்புகிறீர்கள் என்பதை விவரிக்கவும்',
    
    // Quiz
    select_track: 'பாதையைத் தேர்ந்தெடுக்கவும்',
    difficulty: 'கடினம்',
    easy: 'எளிது',
    medium: 'நடுத்தரம்',
    hard: 'கடினம்',
    start_quiz: 'வினாடி வினா தொடங்கு',
    questions: 'கேள்விகள்',
    your_score: 'உங்கள் மதிப்பெண்',
    correct_answers: 'சரியான பதில்கள்',
    
    // Misc
    congratulations: 'வாழ்த்துக்கள்!',
    certificate_earned: 'நீங்கள் சான்றிதழ் பெற்றீர்கள்!',
    explore_more: 'மேலும் பாதைகளை ஆராயுங்கள்',
    badges_earned: 'பெற்ற பேட்ஜ்கள்',
    no_students: 'இதுவரை மாணவர்கள் பதிவு செய்யவில்லை',
    or: 'அல்லது',
    continue_with_google: 'Google உடன் தொடரவும்',
    app_tagline: 'AI கற்றுக்கொள். AI யுடன் உருவாக்கு. எதிர்காலத்தை வடிவமைக்கு.',
    app_subtitle: 'இந்தியாவின் வேடிக்கையான AI கற்றல் தளம்',
    gamified: 'கேமிஃபைட்',
    safe: 'பாதுகாப்பானது',
    nep_2020: 'NEP 2020',
    join_ai_sparks: 'AI Sparks இல் சேரவும்',
    welcome_back: 'மீண்டும் வரவேற்கிறோம்!',
    start_adventure: 'இன்றே AI சாகச பயணத்தைத் தொடங்குங்கள்',
    continue_journey: 'AI கற்றல் பயணத்தைத் தொடரவும்',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang && (savedLang === 'en' || savedLang === 'hi' || savedLang === 'od' || savedLang === 'ta')) {
        setLanguageState(savedLang as LanguageCode);
      }
    } catch (e) {
      console.log('Error loading language:', e);
    }
    setIsLoading(false);
  };

  const setLanguage = async (lang: LanguageCode) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
      
      // Also update on server if user is logged in
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
        await fetch(`${API_URL}/api/user/language`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ language: lang })
        });
      }
    } catch (e) {
      console.log('Error saving language:', e);
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
