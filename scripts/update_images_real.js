const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

// HIGH-QUALITY FRONT-VIEW LAPTOP IMAGES (Vecteezy-style from Unsplash)
// Professional product photography - front facing, clean backgrounds
const IMAGES = {
    apple: [
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=90', // MacBook white bg
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=1200&q=90', // MacBook Pro overhead
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=90', // Silver MacBook
        'https://images.unsplash.com/photo-1541807084-5c52b6b3bd99?auto=format&fit=crop&w=1200&q=90', // MacBook workspace
        'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=1200&q=90', // MacBook Air side
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=90', // MacBook coding
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=90', // MacBook minimal
        'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1200&q=90', // MacBook standard
        'https://images.unsplash.com/photo-1531297461136-82ae8acea530?auto=format&fit=crop&w=1200&q=90', // MacBook aesthetic
        'https://images.unsplash.com/photo-1569770218135-bea267ed7e99?auto=format&fit=crop&w=1200&q=90'  // MacBook screen
    ],
    dell: [
        'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=90', // Dell XPS front
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=90', // Dell screen
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=90', // Dell keyboard
        'https://images.unsplash.com/photo-1598965402089-897ce52e90e9?auto=format&fit=crop&w=1200&q=90', // Dell minimal
        'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=1200&q=90', // Business laptop
        'https://images.unsplash.com/photo-1565518206127-6f8d38446b7e?auto=format&fit=crop&w=1200&q=90', // Silver laptop
        'https://images.unsplash.com/photo-1616788494707-ec7f8772f745?auto=format&fit=crop&w=1200&q=90'  // Dell workspace
    ],
    gaming: [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=90', // RGB gaming
        'https://images.unsplash.com/photo-1592520113018-180c8bc831c9?auto=format&fit=crop&w=1200&q=90', // Dark gaming
        'https://images.unsplash.com/photo-1595327656903-2f54e37ce09b?auto=format&fit=crop&w=1200&q=90', // Alienware
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=90', // E-sports
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=90', // Studio RGB
        'https://images.unsplash.com/photo-1552831388-6a0b3575b32a?auto=format&fit=crop&w=1200&q=90', // ROG logo
        'https://images.unsplash.com/photo-1560529178-855d20c4fc56?auto=format&fit=crop&w=1200&q=90', // Dark sleek
        'https://images.unsplash.com/photo-1587302912306-cf1ed9c33146?auto=format&fit=crop&w=1200&q=90', // Red backlight
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=90'  // Gaming setup
    ],
    hp: [
        'https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?auto=format&fit=crop&w=1200&q=90', // HP Envy
        'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=90', // HP sleek
        'https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1200&q=90', // HP desktop
        'https://images.unsplash.com/photo-1563770095128-425251644781?auto=format&fit=crop&w=1200&q=90', // HP workstation
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=90'  // HP black
    ],
    surface: [
        'https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=1200&q=90', // Surface book
        'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=90', // Surface minimal
        'https://images.unsplash.com/photo-1593642632823-8f78536709c6?auto=format&fit=crop&w=1200&q=90', // Surface vibe
        'https://images.unsplash.com/photo-1585188737397-6c24198c0817?auto=format&fit=crop&w=1200&q=90'  // Surface texture
    ],
    generic: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=90', // Silver generic
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=90', // Black laptop
        'https://images.unsplash.com/photo-1537498425277-228ee1a47197?auto=format&fit=crop&w=1200&q=90', // Modern workspace
        'https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=1200&q=90', // Colorful screen
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=90', // Keyboard view
        'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1200&q=90', // Standard laptop
        'https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&w=1200&q=90', // Thin laptop
        'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=90', // Grey laptop
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=90'  // Clean laptop
    ]
};

const KEYWORDS = [
    { keys: ['apple', 'macbook', 'mac', 'air', 'pro'], type: 'apple' },
    { keys: ['dell', 'xps', 'latitude', 'inspiron'], type: 'dell' },
    { keys: ['gaming', 'msi', 'alienware', 'razer', 'rog', 'predator', 'omen', 'legion', 'beast', 'rtx', 'gtx', 'strix', 'zephyrus', 'blade', 'stealth', 'ge60', 'gt72', 'tuf'], type: 'gaming' },
    { keys: ['hp', 'envy', 'spectre', 'pavilion', 'dragonfly', 'elitebook'], type: 'hp' },
    { keys: ['surface', 'microsoft'], type: 'surface' },
    { keys: ['lenovo', 'thinkpad', 'ideapad', 'yoga', 'asus', 'acer', 'samsung', 'swift', 'vivobook', 'zenbook', 'gram', 'framework', 'chromebook'], type: 'generic' }
];

async function updateImages() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');
        const products = await Product.find({}).toArray();

        // Shufflers for unique distribution
        const pools = {};
        Object.keys(IMAGES).forEach(key => {
            pools[key] = [...IMAGES[key]];
            pools[key].sort(() => Math.random() - 0.5);
        });

        const getNextImage = (type) => {
            if (!pools[type]) type = 'generic';
            if (pools[type].length === 0) {
                pools[type] = [...IMAGES[type]];
                pools[type].sort(() => Math.random() - 0.5);
            }
            return pools[type].pop();
        };

        console.log(`Processing ${products.length} products...`);
        let updatedCount = 0;

        for (const p of products) {
            const nameLower = (p.name || '').toLowerCase();
            const brandLower = (p.brand || '').toLowerCase();
            const descLower = (p.description || '').toLowerCase();

            let matchedType = 'generic';
            for (const group of KEYWORDS) {
                if (group.keys.some(k => nameLower.includes(k) || brandLower.includes(k) || descLower.includes(k))) {
                    matchedType = group.type;
                    break;
                }
            }

            // Override for specific gaming brands
            if (nameLower.includes('rog') || nameLower.includes('alienware') || nameLower.includes('predator') || nameLower.includes('tuf')) {
                matchedType = 'gaming';
            }

            if (!IMAGES[matchedType]) matchedType = 'generic';

            const mainImage = getNextImage(matchedType);
            const other1 = getNextImage(matchedType);
            const other2 = getNextImage(matchedType);
            const gallery = [mainImage, other1, other2].filter((v, i, a) => a.indexOf(v) === i);

            const result = await Product.updateOne(
                { _id: p._id },
                {
                    $set: {
                        image: mainImage,
                        images: gallery
                    }
                }
            );

            if (result.matchedCount > 0) updatedCount++;
            process.stdout.write('.');
        }

        console.log(`\n✅ Updated ${updatedCount}/${products.length} products with high-quality images.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

updateImages();
