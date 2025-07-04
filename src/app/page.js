'use client';

import React, { useState } from 'react';
import { Search, Loader2, ShoppingCart, Info } from 'lucide-react';

const App = () => {
    const [item, setItem] = useState('coffee maker');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!item.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(item)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }
            const data = await response.json();
            if (data.length === 0) {
                setError("No results found. The site may be blocking requests.");
            }
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center space-x-2">
                    <ShoppingCart className="text-indigo-600 h-8 w-8" />
                    <h1 className="text-2xl font-bold text-gray-800">SmartShopper</h1>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border">
                    <form onSubmit={handleSearch}>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                                className="w-full h-14 px-4 text-lg bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" disabled={isLoading} className="h-14 px-8 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center">
                                {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                            </button>
                        </div>
                    </form>
                </div>

                {isLoading && (
                    <div className="text-center p-10">
                        <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                        <p className="mt-4 text-lg font-semibold text-gray-700">Searching Walmart...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center p-10 bg-red-50 text-red-700 rounded-2xl shadow-lg border border-red-200">
                        <Info className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-4 text-lg font-semibold text-red-800">An Error Occurred</h3>
                        <p className="mt-1 text-sm">{error}</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 p-6">Top Results from Walmart</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Product</th>
                                        <th scope="col" className="px-6 py-3">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map(item => (
                                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                            <th scope="row" className="px-6 py-4 font-bold text-gray-900">
                                                <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">{item.name}</a>
                                            </th>
                                            <td className="px-6 py-4 text-green-600 font-semibold">${item.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;