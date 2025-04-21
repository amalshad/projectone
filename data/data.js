// data/data.js
// Sample data for the e-commerce site

const products = {
    bestSellers: [
      {
        id: 1,
        name: 'JP - Space Tablet 10.4" Wi-Fi 32GB',
        image: '/images/tablet.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 2,
        name: 'Ocean Pro 11 - 12.3" Touch Screen',
        image: '/images/touchscreen.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 3,
        name: 'Shel 50" Class LED 4K UHD Smart TV',
        image: '/images/tv.jpg',
        price: 85.00,
        originalPrice: null,
        sale: false
      },
      {
        id: 4,
        name: 'Fitboot Inspire Fitness Tracker With Heart Rate Tracking',
        image: '/images/tracker.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 5,
        name: 'Smartphone Z Pixel Max 128GB Unlocked',
        image: '/images/smartphone.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 6,
        name: '65" Class Nano LED 4K UHD Smart TV',
        image: '/images/tv2.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 7,
        name: 'White Buds Wireless Earbud Headphones',
        image: '/images/earbuds.jpg',
        price: 85.00,
        originalPrice: null,
        sale: false
      },
      {
        id: 8,
        name: 'SDK Portable Bluetooth Speaker',
        image: '/images/speaker.jpg',
        price: 85.00,
        originalPrice: null,
        sale: false
      }
    ],
    onSale: [
      {
        id: 9,
        name: 'Space Moon Smartwatch With Charger',
        image: '/images/smartwatch.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 10,
        name: 'OVE Light Space 5G, 128GB',
        image: '/images/smartphone2.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 11,
        name: 'Pilates 16" Touch Screen Laptop 24GB Memory',
        image: '/images/laptop.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 12,
        name: 'Turn5 Portable Bluetooth Speaker',
        image: '/images/speaker2.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 13,
        name: 'Journey Glass XD Virtual Reality Headset',
        image: '/images/vr.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      },
      {
        id: 14,
        name: 'HD Indoor Wireless 1080p Network Security Camera',
        image: '/images/camera.jpg',
        price: 70.00,
        originalPrice: 85.00,
        sale: true
      }
    ]
  };
  
  const categories = [
    { name: 'Computers', image: '/images/computers.jpg', highlight: false, dark: false },
    { name: 'Mobile', image: '/images/mobile.jpg', highlight: false, dark: false },
    { name: 'Drones & Cameras', image: '/images/drones.jpg', highlight: false, dark: false },
    { name: 'Sale', image: '/images/sale.jpg', highlight: true, dark: false },
    { name: 'Tablets', image: '/images/tablets.jpg', highlight: false, dark: false },
    { name: 'Best Sellers', image: '/images/bestsellers.jpg', highlight: false, dark: true },
    { name: 'TV & Home Cinema', image: '/images/tv-cinema.jpg', highlight: false, dark: false },
    { name: 'Wearable Tech', image: '/images/wearable.jpg', highlight: false, dark: false },
    { name: 'Speakers', image: '/images/speakers.jpg', highlight: false, dark: false },
    { name: 'Headphones', image: '/images/headphones.jpg', highlight: false, dark: false }
  ];
  
  module.exports = { products, categories };
  