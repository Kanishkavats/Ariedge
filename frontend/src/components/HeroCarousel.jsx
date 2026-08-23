import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroCarousel({ featuredBooks = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no books passed or empty, provide some default attractive slides
  const slides = featuredBooks.length > 0 ? featuredBooks.slice(0, 5).map(book => ({
    id: book._id,
    title: book.title,
    subtitle: book.author,
    image: book.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    color: 'bg-brand-600',
  })) : [
    {
      id: '1',
      title: 'Discover a world of knowledge',
      subtitle: 'Browse our extensive collection of books, find your next great read, and manage your borrowing seamlessly.',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      color: 'bg-slate-900',
    },
    {
      id: '2',
      title: 'Your Next Adventure Awaits',
      subtitle: 'From thrilling mysteries to deep educational resources, we have it all.',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      color: 'bg-indigo-900',
    },
    {
      id: '3',
      title: 'Expand Your Horizon',
      subtitle: 'Learn new skills and explore new domains with our hand-picked selections.',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      color: 'bg-brand-800',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[350px] sm:h-[400px] overflow-hidden rounded-2xl shadow-xl mb-8 group" style={{background: '#0f172a'}}>
      {/* All slides stacked – only current one is fully visible */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: idx === currentIndex ? 1 : 0 }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-3xl">
            <h1 
              className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              {slide.title}
            </h1>
            <p className="text-slate-200 text-base sm:text-lg max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
