/* ---- Menu data ----
   img   : file name (no extension) inside the images/ folder.
           The app looks for  images/<img>.png, .webp, .jpg or .jpeg.
   say   : how it sounds after "I'd like ..."
   emoji : placeholder shown until the image file exists.
   Add or remove items freely. Each round picks 3 mains, 2 sides, 2 desserts, 2 drinks. */
window.MENU = {
  mains: [
    {name: "hamburger",       say: "a hamburger",     price: 340,   img: "hamburger",       emoji: "🍔"},
    {name: "hot dog",         say: "a hot dog",       price: 290,   img: "hot-dog",         emoji: "🌭"},
    {name: "pizza",           say: "a pizza",         price: 500,   img: "pizza",           emoji: "🍕"},
    {name: "sandwich",        say: "a sandwich",      price: 180,   img: "sandwich",        emoji: "🥪"},
    {name: "curry and rice",  say: "curry and rice",  price: 490,   img: "curry-and-rice",  emoji: "🍛"},
    {name: "grilled fish",    say: "grilled fish",    price: 490,   img: "grilled-fish",    emoji: "🐟"},
    {name: "fried chicken",   say: "fried chicken",   price: 250,   img: "fried-chicken",   emoji: "🍗"},
    {name: "sushi",           say: "sushi",           price: 400,   img: "sushi",           emoji: "🍣"},
    {name: "steak",           say: "a steak",         price: 630,   img: "steak",           emoji: "🥩"}
  ],
  sides: [
    {name: "French fries",   say: "French fries",   price: 260,  img: "french-fries",   emoji: "🍟"},
    {name: "salad",          say: "a salad",        price: 240,  img: "salad",          emoji: "🥗"},
    {name: "soup",           say: "soup",           price: 270,  img: "soup",           emoji: "🍲"},
    {name: "rice ball",      say: "a rice ball",    price: 120,  img: "rice-ball",      emoji: "🍙"}
  ],
  desserts: [
    {name: "ice cream",      say: "ice cream",      price: 220,  img: "ice-cream",      emoji: "🍨"},
    {name: "cake",           say: "cake",           price: 250,  img: "cake",           emoji: "🍰"},
    {name: "parfait",        say: "a parfait",      price: 320,  img: "parfait",       emoji: "🥞"},
    {name: "pudding",        say: "pudding",        price: 210,  img: "pudding",        emoji: "🍮"},
    {name: "shaved ice",     say: "shaved ice",     price: 170,  img: "shaved-ice",     emoji: "🍧"},
    {name: "donut",          say: "a donut",        price: 100,  img: "donut",          emoji: "🍩"}
  ],
  drinks: [
    {name: "juice",          say: "juice",          price: 200,  img: "juice",          emoji: "🧃"},
    {name: "tea",            say: "a tea",          price: 140,  img: "tea",            emoji: "🍵"},
    {name: "green tea",      say: "a green tea",    price: 170,  img: "green-tea",      emoji: "🍵"},
    {name: "milk",           say: "milk",           price: 110,  img: "milk",           emoji: "🥛"},
    {name: "coffee",         say: "a coffee",       price: 150,  img: "coffee",         emoji: "☕"},
    {name: "cola",           say: "a cola",         price: 200,  img: "cola",           emoji: "🥤"}
  ]
};
