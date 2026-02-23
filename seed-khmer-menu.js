const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, writeBatch } = require("firebase/firestore");

// Load the local env file
require("dotenv").config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
    { id: "cat-soups", name: "Soups (សម្ល)", sortOrder: 1, isActive: true },
    { id: "cat-salads", name: "Salads (ញាំ)", sortOrder: 2, isActive: true },
    { id: "cat-mains", name: "Main Dishes (ម្ហូបចម្បង)", sortOrder: 3, isActive: true },
    { id: "cat-rice-noodles", name: "Rice & Noodles (បាយនិងមី)", sortOrder: 4, isActive: true },
    { id: "cat-desserts", name: "Desserts (បង្អែម)", sortOrder: 5, isActive: true },
    { id: "cat-drinks", name: "Beverages (ភេសជ្ជៈ)", sortOrder: 6, isActive: true },
];

const menuItems = [
    // Soups
    { id: "item-amok", name: "Fish Amok (អាម៉ុកត្រី)", description: "Traditional Cambodian fish curry steamed in banana leaves.", price: 6.50, categoryId: "cat-soups", isActive: true },
    { id: "item-samlor-kako", name: "Samlor Kako (សម្លកកូរ)", description: "Traditional mixed vegetable soup with toasted rice powder and pork.", price: 5.50, categoryId: "cat-soups", isActive: true },
    { id: "item-samlor-machu-kroeung", name: "Samlor Machu Kroeung (សម្លម្ជូរគ្រឿង)", description: "Sour soup with beef, morning glory, and lemongrass paste.", price: 5.00, categoryId: "cat-soups", isActive: true },
    { id: "item-samlor-korko-trey", name: "Samlor Korko Trey", description: "Fish version of the stirred pot soup with abundant green vegetables.", price: 4.50, categoryId: "cat-soups", isActive: true },
    { id: "item-ngam-ngov", name: "Ngam Ngov (ង៉ាំង៉ូវ)", description: "Chicken soup with pickled lime and fresh herbs.", price: 5.50, categoryId: "cat-soups", isActive: true },

    // Salads
    { id: "item-lap-khmer", name: "Lap Khmer (ឡាបខ្មែរ)", description: "Khmer beef salad, thinly sliced with lime juice, garlic, and herbs.", price: 6.00, categoryId: "cat-salads", isActive: true },
    { id: "item-nyoam-svay", name: "Green Mango Salad (ញាំស្វាយ)", description: "Crunchy green mango salad with dried shrimp and peanuts.", price: 4.00, categoryId: "cat-salads", isActive: true },
    { id: "item-nyoam-lahong", name: "Papaya Salad (ញាំល្ហុង)", description: "Spicy green papaya salad with crab and fresh chili.", price: 3.50, categoryId: "cat-salads", isActive: true },
    { id: "item-nyoam-krah", name: "Banana Blossom Salad (ញាំត្រយូងចេក)", description: "Banana blossom tossed with chicken, peanuts, and mint.", price: 4.50, categoryId: "cat-salads", isActive: true },
    { id: "item-prahok-ktis", name: "Prahok Ktis", description: "Fermented fish dip with minced pork and coconut milk, served with fresh veggies.", price: 5.00, categoryId: "cat-salads", isActive: true },

    // Mains
    { id: "item-lok-lak", name: "Beef Lok Lak (ឡុកឡាក់)", description: "Stir-fried marinated beef cubes on a bed of lettuce, tomato, and onion with pepper-lime dip.", price: 7.00, categoryId: "cat-mains", isActive: true },
    { id: "item-kroeung-chha", name: "Chha Kroeung (ឆាគ្រឿង)", description: "Stir-fried pork with lemongrass paste, peanuts, and holy basil.", price: 5.50, categoryId: "cat-mains", isActive: true },
    { id: "item-trey-chieng", name: "Deep Fried Fish (ត្រីចៀន)", description: "Crispy fried fish served with sweet chili sauce or green mango dip.", price: 8.00, categoryId: "cat-mains", isActive: true },
    { id: "item-kho-sach-chrouk", name: "Kho Sach Chrouk (ខសាច់ជ្រូក)", description: "Caramelized pork belly with bamboo shoots and hard-boiled eggs.", price: 6.00, categoryId: "cat-mains", isActive: true },
    { id: "item-chha-khney", name: "Chha Khney (ឆាខ្ញី)", description: "Chicken stir-fried with copious amounts of fresh ginger.", price: 5.00, categoryId: "cat-mains", isActive: true },
    { id: "item-sach-ko-ang", name: "Sach Ko Ang (សាច់គោអាំង)", description: "Grilled beef skewers marinated in lemongrass.", price: 4.00, categoryId: "cat-mains", isActive: true },
    { id: "item-trey-amok-leaf", name: "Trey Amok (Banana Leaf)", description: "Classic fish amok steamed in a banana leaf cup.", price: 6.50, categoryId: "cat-mains", isActive: true },
    { id: "item-pork-ribs", name: "Grilled Pork Ribs (ឆ្អឹងជំនីរអាំង)", description: "Sweet and sticky grilled pork ribs.", price: 7.50, categoryId: "cat-mains", isActive: true },

    // Rice & Noodles
    { id: "item-num-banh-chok", name: "Nom Banh Chok (នំបញ្ចុក)", description: "Khmer noodles topped with fish-based green curry gravy and fresh herbs.", price: 3.00, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-kuy-teav", name: "Kuy Teav (គុយទាវ)", description: "Pork broth rice noodle soup with minced pork, beef balls, and garlic oil.", price: 3.50, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-bai-sach-chrouk", name: "Bai Sach Chrouk (បាយសាច់ជ្រូក)", description: "Broken rice with thinly sliced, sweet grilled pork and pickled veggies.", price: 2.50, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-mi-chha", name: "Mi Chha (មីឆា)", description: "Stir-fried yellow noodles with beef, egg, and vegetables.", price: 3.50, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-bai-chha", name: "Bai Chha (បាយឆា)", description: "Khmer style fried rice with sausage and egg.", price: 3.50, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-lort-chha", name: "Lort Chha (លតឆា)", description: "Stir-fried pin noodles with beef, bean sprouts, and a fried egg on top.", price: 3.50, categoryId: "cat-rice-noodles", isActive: true },
    { id: "item-kav-noodle", name: "Kuy Teav Kho Ko", description: "Rice noodles with rich, star-anise infused beef stew.", price: 4.50, categoryId: "cat-rice-noodles", isActive: true },

    // Desserts
    { id: "item-num-ansorm", name: "Nom Ansorm (នំអន្សម)", description: "Sticky rice cake filled with banana or pork and mung bean.", price: 1.50, categoryId: "cat-desserts", isActive: true },
    { id: "item-num-krok", name: "Nom Krok (នំគ្រក់)", description: "Coconut rice pancakes cooked in a cast iron skillet, served with sweet fish sauce.", price: 2.00, categoryId: "cat-desserts", isActive: true },
    { id: "item-pumpkin-custard", name: "Sangkya Lapov (សង់ខ្យាល្ពៅ)", description: "Sweet coconut custard steamed inside a whole pumpkin.", price: 3.00, categoryId: "cat-desserts", isActive: true },
    { id: "item-chet-chien", name: "Chek Chien (ចេកចៀន)", description: "Crispy deep-fried banana fritters.", price: 1.00, categoryId: "cat-desserts", isActive: true },
    { id: "item-num-pau", name: "Tuk Krok (ទឹកកកឈូស)", description: "Shaved ice dessert with various syrups and condensed milk.", price: 1.50, categoryId: "cat-desserts", isActive: true },
    { id: "item-borbor-thnot", name: "Bobor Thnot", description: "Sweet palm fruit soup with coconut milk and tapioca pearls.", price: 2.00, categoryId: "cat-desserts", isActive: true },

    // Drinks
    { id: "item-iced-coffee", name: "Khmer Iced Coffee (កាហ្វេទឹកដោះគោទឹកកក)", description: "Strong dark roast coffee mixed with sweetened condensed milk over ice.", price: 2.00, categoryId: "cat-drinks", isActive: true },
    { id: "item-fresh-coconut", name: "Fresh Coconut (ដូងក្រអូប)", description: "Chilled young coconut water straight from the shell.", price: 1.50, categoryId: "cat-drinks", isActive: true },
    { id: "item-sugar-cane", name: "Sugarcane Juice (ទឹកអំពៅ)", description: "Freshly pressed sugarcane juice poured over crushed ice.", price: 1.00, categoryId: "cat-drinks", isActive: true },
    { id: "item-lime-soda", name: "Lime Soda (ទឹកក្រូចឆ្មាសូដា)", description: "Freshly squeezed lime juice with simple syrup and soda water.", price: 1.50, categoryId: "cat-drinks", isActive: true },
    { id: "item-angkhor-beer", name: "Angkor Beer (ស្រាបៀរអង្គរ)", description: "The iconic national beer of Cambodia, served ice cold.", price: 1.50, categoryId: "cat-drinks", isActive: true },
    { id: "item-cambodia-beer", name: "Cambodia Beer", description: "Popular local premium lager.", price: 1.50, categoryId: "cat-drinks", isActive: true },
    { id: "item-soy-milk", name: "Fresh Soy Milk (ទឹកសណ្ដែក)", description: "Warm or cold homemade sweet soy milk.", price: 1.00, categoryId: "cat-drinks", isActive: true },
];

const menuSchedules = [
    {
        id: "schedule-all-day",
        name: "All Day Khmer Menu",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Everyday
        startTime: "00:00",
        endTime: "23:59",
        menuItemIds: menuItems.map(item => item.id),
        isActive: true
    },
    {
        id: "schedule-breakfast",
        name: "Breakfast Special",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: "06:00",
        endTime: "10:30",
        menuItemIds: [
            "item-kuy-teav",
            "item-bai-sach-chrouk",
            "item-num-banh-chok",
            "item-iced-coffee"
        ],
        isActive: true
    }
];

async function seed() {
    console.log("Starting DB menu seed...");
    try {
        const batch = writeBatch(db);

        // Seed Categories
        categories.forEach(cat => {
            const ref = doc(collection(db, "categories"), cat.id);
            batch.set(ref, cat);
        });
        console.log(`Queueing ${categories.length} categories...`);

        // Seed Items
        menuItems.forEach(item => {
            const ref = doc(collection(db, "menuItems"), item.id);
            batch.set(ref, item);
        });
        console.log(`Queueing ${menuItems.length} menu items...`);

        // Seed Schedules
        menuSchedules.forEach(sched => {
            const ref = doc(collection(db, "menuSchedules"), sched.id);
            batch.set(ref, sched);
        });
        console.log(`Queueing ${menuSchedules.length} schedules...`);

        // Commit all at once (Transactions/Batches are capped at 500 ops in Firestore, we have ~40)
        await batch.commit();
        console.log("✅ Seed completed successfully! ~ 50 items loaded into Firestore.");

        process.exit(0);
    } catch (e) {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    }
}

seed();
