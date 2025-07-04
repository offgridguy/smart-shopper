// File: src/app/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Settings, Star, Zap, ChevronDown, ChevronUp, MessageSquare, Loader2, ShoppingCart, Info, Link, Sparkles } from 'lucide-react';

// --- UI COMPONENTS ---

const Header = () => (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <ShoppingCart className="text-indigo-600 h-8 w-8" />
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SmartShopper</h1>
            </div>
        </div>
    </header>
);

const SearchControls = ({ onSearch, isLoading }) => {
    const [item, setItem] = useState('running shoes');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const [priorities, setPriorities] = useState([
        { id: 'price', name: 'Price (Lowest First)', checked: true },
        { id: 'rating', name: 'Rating (Highest First)', checked: false },
    ]);

    const allSourcesList = useMemo(() => [
        { id: 'Amazon', name: 'Amazon' }, { id: 'Walmart', name: 'Walmart' }, { id: 'REI', name: 'REI' },
        { id: 'Zappos', name: 'Zappos' }, { id: 'Best Buy', name: 'Best Buy' },
        { id: 'Target', name: 'Target' },
    ], []);

    const [sources, setSources] = useState(() => allSourcesList.map(s => ({...s, checked: ['Walmart', 'Best Buy', 'Target'].includes(s.id) })));
    const [yoloMode, setYoloMode] = useState(false);
    
    const handlePriorityChange = (id) => {
        setPriorities(priorities.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
    };

    const handleSourceChange = (id) => {
        setSources(sources.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
    };
    
    const handleYoloChange = () => {
        const isYolo = !yoloMode;
        setYoloMode(isYolo);
        setSources(sources.map(s => ({...s, checked: isYolo ? true : s.checked})));
    }

    const handleSuggestSources = () => {
        // This is a simplified logic for demonstration
        const sourceCategories = {
            'electronics': ['Best Buy', 'Walmart', 'Target', 'Amazon'],
            'sporting_goods': ['REI', 'Walmart', 'Target', 'Amazon'],
            'default': ['Walmart', 'Target', 'Amazon'],
        };
        const keywordToCategory = {
            'printer': 'electronics', 'laptop': 'electronics', 'tv': 'electronics', 'camera': 'electronics', 'headphones': 'electronics',
            'shoes': 'sporting_goods', 'tent': 'sporting_goods',
        };
        const getCategoryFromQuery = (query) => {
            const lowerQuery = query.toLowerCase();
            for (const keyword in keywordToCategory) {
                if (lowerQuery.includes(keyword)) return keywordToCategory[keyword];
            }
            return 'default';
        };
        const category = getCategoryFromQuery(item);
        const suggestedSources = sourceCategories[category];
        const newSources = allSourcesList.map(source => ({
            ...source,
            checked: suggestedSources.includes(source.id)
        }));
        setSources(newSources);
        if (!isAdvancedOpen) setIsAdvancedOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!item.trim() || isLoading) return;
        const searchParams = {
            query: item,
            sources: sources.filter(s => s.checked).map(s => s.id),
        };
        onSearch(searchParams);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <form onSubmit={handleSubmit}>
                <div className="flex flex-wrap gap-4">
                    <div className="relative flex-grow min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            placeholder="e.g., 'laptops', 'running shoes'"
                            className="w-full h-14 pl-12 pr-4 text-lg bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="h-14 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all flex items-center justify-center disabled:bg-indigo-400 flex-grow sm:flex-grow-0">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Search className="mr-2" /><span>Search</span></>}
                    </button>
                    <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="h-14 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all flex items-center justify-center flex-grow sm:flex-grow-0">
                        <Settings size={20} className="mr-2" />
                        <span>Sources</span>
                        {isAdvancedOpen ? <ChevronUp className="ml-1" /> : <ChevronDown className="ml-1" />}
                    </button>
                </div>
                {isAdvancedOpen && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-down">
                        <div className="md:col-span-2">
                            <h3 className="font-semibold text-gray-700 mb-3">Which sites to include?</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {sources.map(s => (
                                    <label key={s.id} className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${s.checked ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-50'}`}>
                                        <input type="checkbox" checked={s.checked} onChange={() => handleSourceChange(s.id)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                                        <span className="ml-3 text-sm font-medium text-gray-700">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                             <h3 className="font-semibold text-gray-700 mb-3">YOLO Mode</h3>
                             <label className="flex items-center p-3 rounded-lg border transition-all cursor-pointer bg-yellow-50 border-yellow-300 hover:bg-yellow-100">
                                <Zap className="h-5 w-5 text-yellow-600"/>
                                <span className="ml-3 text-sm font-medium text-gray-700">Search everywhere!</span>
                                <input type="checkbox" checked={yoloMode} onChange={handleYoloChange} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 ml-auto" />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Let our AI do a broad search across dozens of retailers. May take longer.</p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

const ResultsTable = ({ results, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="text-center p-10">
                <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                <p className="mt-4 text-lg font-semibold text-gray-700">Searching the web for you...</p>
                <p className="text-sm text-gray-500">This can take a moment.</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="text-center p-10 bg-red-50 text-red-700 rounded-2xl shadow-lg border border-red-200">
                <Info className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-4 text-lg font-semibold text-red-800">An Error Occurred</h3>
                <p className="mt-1 text-sm">{error}</p>
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="text-center p-10 bg-white rounded-2xl shadow-lg border border-gray-100">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-800">Ready to find the perfect item?</h3>
                <p className="mt-1 text-sm text-gray-500">Use the search bar and select sources above.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 p-6">Top {results.length} Results</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product</th>
                            <th scope="col" className="px-6 py-3">Price</th>
                            <th scope="col" className="px-6 py-3">Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(item => (
                            <tr key={item.id || item.productUrl} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                                    <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline transition-colors">
                                        {item.name}
                                    </a>
                                </th>
                                <td className="px-6 py-4 text-green-600 font-semibold">${item.price.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full hover:bg-indigo-200 transition-colors">{item.source}</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const App = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (params) => {
        setIsLoading(true);
        setSearchResults([]);
        setError(null);
        
        try {
            // ** THIS IS THE MAIN CHANGE **
            // We now send the sources to the backend API
            const sites = params.sources.join(',');
            if (!sites) {
                setError("Please select at least one source website to search.");
                setIsLoading(false);
                return;
            }
            const response = await fetch(`/api/search?query=${encodeURIComponent(params.query)}&sources=${encodeURIComponent(sites)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong on the server.');
            }
            const data = await response.json();
            if (data.length === 0) {
                setError("Could not find any products for this search. Try a different query or other websites.");
            }
            setSearchResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header />
            <main className="container mx-auto p-4 md:p-8 space-y-8">
                <SearchControls onSearch={handleSearch} isLoading={isLoading} />
                <ResultsTable results={searchResults} isLoading={isLoading} error={error} />
            </main>
            <footer className="text-center py-6 text-sm text-gray-500">
                <p>&copy; 2025 SmartShopper. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;