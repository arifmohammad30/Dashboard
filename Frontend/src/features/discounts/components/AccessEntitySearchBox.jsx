import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import { searchAccessEntities } from '../api/discountService';

export default function AccessEntitySearchBox({
  category,
  placeholder = "Type to search...",
  selectedItems = [],
  onChange
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await searchAccessEntities(category, query);
        if (isMounted) {
          setOptions(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error(`Failed to fetch access options for ${category}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchOptions, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [category, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddItem = (item) => {
    const itemLabel = typeof item === 'object' ? (item.name || item.label) : item;
    if (!selectedItems.includes(itemLabel)) {
      const next = [...selectedItems, itemLabel];
      onChange(next);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleRemoveItem = (itemToRemove) => {
    const next = selectedItems.filter(i => i !== itemToRemove);
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      handleAddItem(query.trim());
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full relative" ref={containerRef}>
      {/* Selected Tags / Chips Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-stone-50 border border-stone-200/80 rounded-xl">
          {selectedItems.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-sky-200/90 text-sky-800 rounded-lg text-xs font-bold shadow-2xs animate-in fade-in"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input Field */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-800 placeholder-stone-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-2xs"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-stone-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-stone-100 animate-in fade-in duration-150">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs font-medium text-stone-400">
              {loading ? 'Searching backend...' : query ? `No matching ${category} found. Press Enter to add "${query}"` : `Type to search ${category}...`}
            </div>
          ) : (
            options.map((opt, idx) => {
              const optLabel = opt.name || opt.label;
              const isSelected = selectedItems.includes(optLabel);

              return (
                <button
                  key={opt.id || idx}
                  type="button"
                  onClick={() => handleAddItem(opt)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-50/60 font-bold text-sky-700' : 'text-stone-700'
                  }`}
                >
                  <span>{opt.label || opt.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
