
import { BlogPost } from '../types';

const STORAGE_KEY = 'botanicmd_blog_posts';

// Real, high-quality articles
const seedPosts: BlogPost[] = [
  {
    id: 1,
    title: "The Ultimate Guide to Indoor Plant Care",
    excerpt: "Master the basics of keeping your indoor garden thriving. From understanding light requirements to mastering the art of watering, this guide covers it all.",
    content: `
      <h3>Introduction</h3>
      <p> bringing nature indoors is one of the best ways to enhance your living space and boost your mental well-being. However, for many, the transition from a plant admirer to a successful plant parent can be filled with yellow leaves and drooping stems. This guide is your roadmap to success.</p>
      
      <h3>1. Understanding Light: The Foundation of Life</h3>
      <p>Light is food for plants. Without it, they starve. But not all light is created equal:</p>
      <ul>
        <li><strong>Bright, Direct Light:</strong> Think of a south-facing window where sunbeams hit the leaves directly. Cacti, succulents, and many herbs thrive here.</li>
        <li><strong>Bright, Indirect Light:</strong> This is the "goldilocks" zone for most tropical houseplants like Monsteras and Fiddle Leaf Figs. It's a bright room, but the sun doesn't burn the foliage.</li>
        <li><strong>Low Light:</strong> North-facing windows or corners of a room. Snake Plants and ZZ Plants are champions here, though they will grow slower.</li>
      </ul>

      <h3>2. The Art of Watering</h3>
      <p>Overwatering is the #1 killer of indoor plants. It suffocates the roots, leading to rot. Here is the golden rule: <strong>Check the soil, not the calendar.</strong></p>
      <p>Stick your finger about an inch into the soil. If it feels dry, it's time to water. If it's damp, wait a few days. When you do water, be thorough. Let water run through the drainage holes to flush out salts and ensure deep root hydration.</p>

      <h3>3. Humidity and Temperature</h3>
      <p>Most houseplants come from tropical rainforests where humidity is 70-90%. Our homes are usually 30-40%. Signs of low humidity include brown, crispy leaf tips. You can increase humidity by misting, using a pebble tray, or buying a humidifier.</p>

      <h3>Conclusion</h3>
      <p>Gardening is a journey of patience. Observe your plants daily, learn their language, and don't be afraid to make mistakes. Every yellow leaf is a lesson learned.</p>
    `,
    category: "Care Guides",
    date: "Oct 12, 2024",
    author: "Sarah Green",
    imageUrl: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Why Your Leaves Are Turning Yellow",
    excerpt: "Yellow leaves are a cry for help, but what are they saying? Learn to diagnose chlorosis, watering issues, and nutrient deficiencies.",
    content: `
      <p>Walking up to your favorite plant and seeing a bright yellow leaf can be heartbreaking. Chlorosis, the loss of green pigment, is a symptom, not a disease itself. Here is how to play detective.</p>

      <h3>1. Moisture Stress (The Usual Suspect)</h3>
      <p>Ironically, both overwatering and underwatering can cause yellowing.</p>
      <ul>
        <li><strong>Overwatering:</strong> Leaves turn yellow and feel soft or mushy. The soil will be wet. This is urgent; check for root rot immediately.</li>
        <li><strong>Underwatering:</strong> Leaves turn yellow but feel crispy and dry. The soil will be pulling away from the pot edges.</li>
      </ul>

      <h3>2. Nutrient Deficiency</h3>
      <p>If your watering is perfect, your plant might be hungry. Nitrogen deficiency often causes older, lower leaves to turn pale yellow while the new growth remains green. A balanced liquid fertilizer can fix this quickly.</p>

      <h3>3. Pests</h3>
      <p>Inspect the underside of the yellow leaves. Spider mites, aphids, and mealybugs suck the sap from the leaves, causing discoloration. If you see tiny webs or cotton-like fluff, isolate the plant and treat with Neem oil.</p>

      <h3>4. Natural Aging</h3>
      <p>Sometimes, it's not your fault! Plants naturally shed their oldest, lowest leaves to focus energy on new growth. If it's just one leaf at the bottom and the rest of the plant looks healthy, just snip it off and relax.</p>
    `,
    category: "Plant Doctor",
    date: "Oct 15, 2024",
    author: "Dr. Bloom",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "10 Plants That Purify Your Air",
    excerpt: "Based on the famous NASA Clean Air Study, these plants act as natural filters, removing toxins like benzene and formaldehyde from your home.",
    content: `
      <p>In the late 80s, NASA conducted a study to determine the best ways to clean the air in space stations. They discovered that common houseplants are efficient at removing volatile organic compounds (VOCs) like formaldehyde and benzene from the air.</p>

      <h3>Top Air Purifiers</h3>
      <ol>
        <li><strong>Snake Plant (Sansevieria):</strong> One of the few plants that releases oxygen at night, making it perfect for bedrooms. It filters formaldehyde effectively.</li>
        <li><strong>Spider Plant (Chlorophytum comosum):</strong> Resilient and safe for pets. It battles benzene, formaldehyde, carbon monoxide, and xylene.</li>
        <li><strong>Peace Lily (Spathiphyllum):</strong> Beautiful blooms and powerful filtration capabilities. Note: Toxic to cats and dogs.</li>
        <li><strong>Aloe Vera:</strong> Great for burns and great for clearing formaldehyde from the air.</li>
        <li><strong>Boston Fern:</strong> Excellent at adding humidity to the air and removing mold spores.</li>
      </ol>

      <h3>How Many Do You Need?</h3>
      <p>While plants do help, you would need a jungle to fully purify a modern home. NASA recommended at least one plant per 100 square feet. So go ahead, buy more plants—it's for your health!</p>
    `,
    category: "Wellness",
    date: "Oct 20, 2024",
    author: "Mike Leaf",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Propagating Monsteras: A Step-by-Step Guide",
    excerpt: "Multiply your collection for free! Learn the water propagation method to turn one Monstera Deliciosa into an entire indoor jungle.",
    content: `
      <p>Propagation is the closest thing to magic in the plant world. Taking a cutting and watching roots emerge is incredibly satisfying. The <em>Monstera Deliciosa</em> is one of the easiest plants to propagate.</p>

      <h3>Tools You Need</h3>
      <ul>
        <li>A sharp, sterilized knife or shears</li>
        <li>A glass jar or vase</li>
        <li>Clean water</li>
      </ul>

      <h3>The Process</h3>
      <p><strong>Step 1: Find the Node.</strong> Look at the stem of your Monstera. You will see bumps or aerial roots where the leaf meets the main stem. This is the node. You MUST include a node in your cutting; a leaf stem alone will not grow roots.</p>
      <p><strong>Step 2: The Cut.</strong> Cut about an inch below the node.</p>
      <p><strong>Step 3: Water.</strong> Place the cutting in the jar, ensuring the node is submerged but the leaf is not. Place in bright, indirect light.</p>
      <p><strong>Step 4: Wait.</strong> Change the water once a week. In 2-4 weeks, you will see white roots appearing. When the roots are 2-3 inches long, you can transplant into soil!</p>
    `,
    category: "DIY & Projects",
    date: "Oct 25, 2024",
    author: "Sarah Green",
    imageUrl: "https://images.unsplash.com/photo-1598880940371-c756e015aba9?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "Succulents: How Not to Kill Them",
    excerpt: "They are sold as 'easy care', yet they are the most commonly killed houseplant. Discover the secret to keeping succulents alive.",
    content: `
      <p>We've all been there. You buy a cute succulent, put it on your desk, water it occasionally, and three weeks later it's a mushy pile of sadness. Why? Because we love them too much.</p>

      <h3>The Desert Mindset</h3>
      <p>Succulents are built for drought. They store water in their fleshy leaves. In the home, they need to replicate their desert environment.</p>

      <h3>The 3 Rules of Succulent Club</h3>
      <ol>
        <li><strong>Drainage is Non-Negotiable:</strong> Your pot MUST have a hole. If water sits at the bottom, the roots will rot in days.</li>
        <li><strong>The 'Soak and Dry' Method:</strong> Never water sip-by-sip. Drench the soil completely until water runs out the bottom, then ignore the plant until the soil is bone dry. This mimics desert flash floods.</li>
        <li><strong>Light, Light, Light:</strong> Succulents need direct sun. A dark corner of a bookshelf is a death sentence. If they start growing tall and stretched out (etiolation), they are screaming for more sun.</li>
      </ol>
    `,
    category: "Care Guides",
    date: "Nov 01, 2024",
    author: "BotanicMD Team",
    imageUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "The Secret Life of Roots",
    excerpt: "What happens beneath the soil is just as important as what happens above. Understanding root health is the key to a long-lasting garden.",
    content: `
      <p>Out of sight, out of mind? Not when it comes to plants. The root system is the engine of your plant, pumping water and nutrients to the foliage. Healthy roots equal a healthy plant.</p>

      <h3>Healthy vs. Unhealthy Roots</h3>
      <p>If you ever repot a plant, take a look at the roots:</p>
      <ul>
        <li><strong>Healthy Roots:</strong> Firm, white or tan in color, and earthy smelling.</li>
        <li><strong>Root Rot:</strong> Mushy, slimy, black or dark brown, and often smell like swamp water or rotting eggs.</li>
      </ul>

      <h3>Preventing Root Bound Plants</h3>
      <p>When roots run out of space, they start circling the pot, choking themselves. This is called being "root bound". If you water your plant and the water runs straight through instantly, or if growth has stalled, check the roots. If they are a tight spiral, it's time for a bigger pot.</p>
    `,
    category: "Science",
    date: "Nov 05, 2024",
    author: "Dr. Bloom",
    imageUrl: "https://images.unsplash.com/photo-1591088398332-a5875ecb7ddb?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 7,
    title: "Dealing with Fungus Gnats",
    excerpt: "Tiny flying bugs driving you crazy? Those are fungus gnats. Here is how to eradicate them without using harsh chemicals.",
    content: `
      <p>You go to water your plant and a cloud of tiny black flies erupts from the soil. Fungus gnats. They are annoying, and their larvae can damage young roots.</p>

      <h3>Why do I have them?</h3>
      <p>Fungus gnats love moisture. They lay their eggs in the top inch of damp soil. If you keep your soil constantly moist, you are rolling out the red carpet for them.</p>

      <h3>The Cure</h3>
      <ol>
        <li><strong>Let it Dry:</strong> Let the top 2 inches of soil dry out completely. This kills the larvae which need moisture to survive.</li>
        <li><strong>Sticky Traps:</strong> Yellow sticky traps catch the flying adults, preventing them from laying more eggs.</li>
        <li><strong>Mosquito Bits (BTI):</strong> This is a biological bacteria that kills the larvae but is safe for plants and pets. Soak "Mosquito Bits" in your watering can before watering.</li>
        <li><strong>Cinnamon:</strong> Sprinkling cinnamon on the soil surface acts as a natural fungicide, removing the food source for the larvae.</li>
      </ol>
    `,
    category: "Pest Control",
    date: "Nov 10, 2024",
    author: "Mike Leaf",
    imageUrl: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 8,
    title: "Best Low Light Plants for Bathrooms",
    excerpt: "Bathrooms can be tricky environments with low light and high humidity. Meet the plants that actually love these conditions.",
    content: `
      <p>Want to turn your bathroom into a spa-like oasis? You need plants that thrive in high humidity and tolerate lower light conditions (assuming you have at least a small window).</p>

      <h3>1. Boston Fern</h3>
      <p>The classic bathroom plant. It craves the steam from your shower and looks elegant hanging in a corner. It hates dry air, so the bathroom is its happy place.</p>

      <h3>2. ZZ Plant (Zamioculcas zamiifolia)</h3>
      <p>Indestructible. The ZZ plant tolerates low light and neglect better than almost any other plant. Its waxy leaves look great next to modern fixtures.</p>

      <h3>3. Pothos (Epipremnum aureum)</h3>
      <p>Fast-growing vines that can trail over a mirror or shower rod. It's very forgiving and handles various light levels.</p>

      <h3>4. Calathea</h3>
      <p>Known for their stunning patterned foliage. Calatheas usually struggle in living rooms due to dry air, but they flourish in the humid environment of a bathroom.</p>
    `,
    category: "Design",
    date: "Nov 15, 2024",
    author: "Sarah Green",
    imageUrl: "https://images.unsplash.com/photo-1551893665-2843f219f912?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 9,
    title: "Fertilizer Basics: Feeding Your Green Friends",
    excerpt: "N-P-K? Liquid vs. Granular? We demystify plant food so you can boost growth without burning your roots.",
    content: `
      <p>Plants make their own food via photosynthesis, but they still need vitamins and minerals from the soil to build new leaves and roots. In a pot, nutrients run out eventually. That's where you come in.</p>

      <h3>Decoding the N-P-K Ratio</h3>
      <p>Every fertilizer bottle has three numbers, like 10-10-10. This stands for:</p>
      <ul>
        <li><strong>N (Nitrogen):</strong> For leafy green growth.</li>
        <li><strong>P (Phosphorus):</strong> For roots and flowers/fruits.</li>
        <li><strong>K (Potassium):</strong> For overall health and disease resistance.</li>
      </ul>

      <h3>When to Fertilize</h3>
      <p>Only fertilize during the growing season (Spring and Summer). Do NOT fertilize in winter when the plant is dormant; the unused nutrients can build up and burn the roots. Always dilute liquid fertilizer to half-strength to be safe.</p>
    `,
    category: "Care Guides",
    date: "Nov 20, 2024",
    author: "Dr. Bloom",
    imageUrl: "https://images.unsplash.com/photo-1628676265436-238b39936843?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 10,
    title: "Hydroponics at Home: Growing Without Soil",
    excerpt: "No soil? No problem. Discover the clean, pest-free world of growing plants in water and LECA.",
    content: `
      <p>Tired of fungus gnats and messy repotting sessions? Hydroponics might be for you. Many houseplants can live happily in just water or semi-hydroponic mediums like LECA (Lightweight Expanded Clay Aggregate).</p>

      <h3>Benefits of Soil-free Growing</h3>
      <ul>
        <li><strong>No Pests:</strong> Most soil-borne pests like gnats disappear.</li>
        <li><strong>Less Guesswork:</strong> You can see the water level, so you know exactly when to refill.</li>
        <li><strong>Cleaner:</strong> No dirt spills on your carpet.</li>
      </ul>

      <h3>LECA Basics</h3>
      <p>LECA balls wick water up to the roots while providing plenty of oxygen. To convert a plant, wash ALL soil off the roots (be gentle!), place in a glass vessel with LECA, and fill the reservoir about 1/3 of the way up. Use a hydroponic nutrient solution in the water.</p>
    `,
    category: "Technology",
    date: "Nov 25, 2024",
    author: "Mike Leaf",
    imageUrl: "https://images.unsplash.com/photo-1556955112-28cde3817b0a?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 11,
    title: "Pet-Friendly Houseplants",
    excerpt: "Keep your furry friends safe. A list of beautiful, non-toxic plants that won't harm cats or dogs if nibbled.",
    content: `
      <p>We love our pets, but our pets often love our plants... as a snack. Many popular plants like Lilies, Sago Palms, and Monsteras are toxic. However, you don't have to choose between Fido and foliage.</p>

      <h3>Safe & Stylish Options</h3>
      <ol>
        <li><strong>Calathea (Prayer Plant):</strong> Completely non-toxic and stunningly patterned.</li>
        <li><strong>Spider Plant:</strong> Safe (though some cats find them mildly hallucinogenic like catnip, so they might obsess over it!).</li>
        <li><strong>Boston Fern:</strong> Lush, green, and totally safe.</li>
        <li><strong>Peperomia:</strong> Comes in many varieties (Watermelon, Rubber) and all are pet-safe.</li>
        <li><strong>Orchids:</strong> Surprisingly, these elegant blooms are non-toxic to cats and dogs.</li>
      </ol>
    `,
    category: "Wellness",
    date: "Nov 28, 2024",
    author: "Sarah Green",
    imageUrl: "https://images.unsplash.com/photo-1586899503123-c968f424f441?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 12,
    title: "The Zen of Bonsai",
    excerpt: "Bonsai is not a type of plant; it is an art form. Understanding the patience and discipline behind these miniature trees.",
    content: `
      <p>Bonsai (literally "planted in container") is an ancient Japanese art form using cultivation techniques to produce small trees in containers that mimic the shape and scale of full-size trees.</p>

      <h3>It's About Discipline</h3>
      <p>Bonsai requires daily attention. Watering is an art because the pots are shallow and dry out quickly. Pruning is done not just for health, but for aesthetics.</p>

      <h3>Getting Started</h3>
      <p>Don't start with a difficult tree. A <em>Ficus Ginseng</em> or a <em>Juniper</em> (for outdoor) are good starter trees. Remember, a Bonsai is never "finished"; it is a living sculpture that changes with the seasons and years.</p>
    `,
    category: "Design",
    date: "Dec 01, 2024",
    author: "BotanicMD Team",
    imageUrl: "https://images.unsplash.com/photo-1599598425947-b623e64a88c7?q=80&w=1200&auto=format&fit=crop"
  }
];

class BlogService {
  getPosts(): BlogPost[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
      return seedPosts;
    }
    return JSON.parse(stored);
  }

  getPost(id: number): BlogPost | undefined {
    const posts = this.getPosts();
    return posts.find(p => p.id === id);
  }

  savePost(post: Omit<BlogPost, 'id'> & { id?: number }): BlogPost {
    const posts = this.getPosts();
    let newPost: BlogPost;

    if (post.id) {
      // Update
      const index = posts.findIndex(p => p.id === post.id);
      if (index !== -1) {
        newPost = { ...posts[index], ...post } as BlogPost;
        posts[index] = newPost;
      } else {
        throw new Error("Post not found");
      }
    } else {
      // Create
      const maxId = posts.reduce((max, p) => Math.max(max, p.id), 0);
      newPost = { ...post, id: maxId + 1 } as BlogPost;
      posts.unshift(newPost);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newPost;
  }

  deletePost(id: number): void {
    const posts = this.getPosts();
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export const blogService = new BlogService();
