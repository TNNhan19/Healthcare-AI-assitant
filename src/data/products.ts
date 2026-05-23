import { Product } from '../context/CartContext';

export const products: Product[] = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    price: 15000,
    originalPrice: 20000,
    image: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Medications",
    description: "Pain relief and fever reducer. Safe for adults and children over 12.",
    rating: 4.8,
    reviews: 156,
    inStock: true,
    prescription: false,
    ingredients: "Paracetamol 500mg",
    dosage: "1-2 tablets every 4-6 hours, maximum 8 tablets per day",
    sideEffects: "Rare: skin rash, nausea. Stop use if allergic reaction occurs.",
    manufacturer: "Teva Pharmaceuticals"
  },
  {
    id: 2,
    name: "Digital Thermometer",
    price: 89000,
    image: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Medical Devices",
    description: "Fast and accurate digital thermometer with LCD display.",
    rating: 4.6,
    reviews: 89,
    inStock: true,
    manufacturer: "Omron Healthcare"
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    price: 45000,
    originalPrice: 55000,
    image: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Supplements",
    description: "Immune system support with high-potency Vitamin C tablets.",
    rating: 4.7,
    reviews: 234,
    inStock: true,
    ingredients: "Ascorbic Acid 1000mg",
    dosage: "1 tablet daily with food",
    manufacturer: "Nature's Way"
  },
  {
    id: 4,
    name: "Blood Pressure Monitor",
    price: 350000,
    image: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Medical Devices",
    description: "Automatic digital blood pressure monitor with large display.",
    rating: 4.5,
    reviews: 67,
    inStock: true,
    manufacturer: "Omron Healthcare"
  },
  {
    id: 5,
    name: "Omega-3 Fish Oil",
    price: 125000,
    image: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Supplements",
    description: "Heart health support with premium omega-3 fatty acids.",
    rating: 4.9,
    reviews: 312,
    inStock: true,
    ingredients: "EPA 180mg, DHA 120mg per capsule",
    dosage: "2 capsules daily with meals",
    manufacturer: "Nordic Naturals"
  },
  {
    id: 6,
    name: "First Aid Kit",
    price: 89000,
    image: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Medical Supplies",
    description: "Complete first aid kit for home and travel emergencies.",
    rating: 4.4,
    reviews: 123,
    inStock: true,
    manufacturer: "Johnson & Johnson"
  },
  {
    id: 7,
    name: "Ibuprofen 400mg",
    price: 25000,
    image: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Medications",
    description: "Anti-inflammatory pain reliever for headaches, muscle pain, and fever.",
    rating: 4.6,
    reviews: 89,
    inStock: true,
    prescription: false,
    ingredients: "Ibuprofen 400mg",
    dosage: "1 tablet every 6-8 hours with food, maximum 3 tablets per day",
    sideEffects: "May cause stomach upset. Take with food.",
    manufacturer: "Pfizer"
  },
  {
    id: 8,
    name: "Multivitamin Complex",
    price: 75000,
    originalPrice: 90000,
    image: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Supplements",
    description: "Complete daily multivitamin with essential vitamins and minerals.",
    rating: 4.5,
    reviews: 178,
    inStock: true,
    ingredients: "Vitamins A, C, D, E, B-complex, Iron, Calcium, Zinc",
    dosage: "1 tablet daily with breakfast",
    manufacturer: "Centrum"
  }
];

export const categories = [
  { name: "Medications", icon: "💊", count: 150 },
  { name: "Supplements", icon: "🌿", count: 89 },
  { name: "Medical Devices", icon: "🩺", count: 45 },
  { name: "Medical Supplies", icon: "🏥", count: 67 },
  { name: "Personal Care", icon: "🧴", count: 234 },
  { name: "Baby Care", icon: "👶", count: 78 }
];