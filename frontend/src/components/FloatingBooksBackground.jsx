import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Curated list of real book covers from Open Library
const BOOK_COVERS = [
  'https://covers.openlibrary.org/b/id/8739161-M.jpg',
  'https://covers.openlibrary.org/b/id/8231856-M.jpg',
  'https://covers.openlibrary.org/b/id/10527843-M.jpg',
  'https://covers.openlibrary.org/b/id/8226197-M.jpg',
  'https://covers.openlibrary.org/b/id/7222246-M.jpg',
  'https://covers.openlibrary.org/b/id/6978028-M.jpg',
  'https://covers.openlibrary.org/b/id/8231989-M.jpg',
  'https://covers.openlibrary.org/b/id/10527831-M.jpg',
  'https://covers.openlibrary.org/b/id/8410437-M.jpg',
  'https://covers.openlibrary.org/b/id/9255566-M.jpg',
  'https://covers.openlibrary.org/b/id/6497154-M.jpg',
  'https://covers.openlibrary.org/b/id/7984916-M.jpg',
  'https://covers.openlibrary.org/b/id/8743775-M.jpg',
  'https://covers.openlibrary.org/b/id/10004355-M.jpg',
];

function FloatingBook({ src, style, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: [0.85, 1, 0.85],
        y: [0, -18, 0],
        rotate: [style.rotate, style.rotate + 3, style.rotate],
      }}
      transition={{
        duration: 5 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <img
        src={src}
        alt=""
        className="rounded shadow-xl object-cover"
        style={{ width: style.width, height: style.height }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </motion.div>
  );
}

export default function FloatingBooksBackground({ books = [] }) {
  // Use actual book covers if provided, else fallback
  const covers = books.length > 0
    ? books.filter(b => b.imageUrl).map(b => b.imageUrl).slice(0, 14)
    : BOOK_COVERS;

  // Pre-defined positions for a nice scattered look — left and right sides
  const bookConfigs = [
    { top: '5%',   left: '2%',   width: 72,  height: 100, rotate: -15 },
    { top: '30%',  left: '1%',   width: 60,  height: 88,  rotate: 10 },
    { top: '58%',  left: '3%',   width: 80,  height: 110, rotate: -8 },
    { top: '75%',  left: '7%',   width: 60,  height: 84,  rotate: 15 },
    { top: '15%',  left: '12%',  width: 56,  height: 78,  rotate: 5 },
    { top: '48%',  left: '9%',   width: 64,  height: 90,  rotate: -12 },
    { top: '85%',  left: '14%',  width: 54,  height: 76,  rotate: 8 },
    { top: '5%',   right: '2%',  width: 72,  height: 100, rotate: 12 },
    { top: '28%',  right: '1%',  width: 64,  height: 90,  rotate: -10 },
    { top: '55%',  right: '4%',  width: 76,  height: 106, rotate: 6 },
    { top: '72%',  right: '8%',  width: 60,  height: 84,  rotate: -14 },
    { top: '18%',  right: '12%', width: 56,  height: 78,  rotate: -5 },
    { top: '44%',  right: '10%', width: 68,  height: 94,  rotate: 10 },
    { top: '82%',  right: '14%', width: 52,  height: 72,  rotate: -8 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {bookConfigs.map((cfg, i) => (
        <FloatingBook
          key={i}
          src={covers[i % covers.length]}
          style={cfg}
          delay={i * 0.3}
        />
      ))}
    </div>
  );
}
