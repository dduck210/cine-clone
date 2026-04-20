import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';

const TestAPI = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/movies');
                console.log('Movies fetched from BE:', response.data);
                setMovies(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) return <div className="p-8">Loading movies...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Movies from Backend API</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                    <div key={movie._id} className="border rounded-lg p-4 shadow-lg">
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-64 object-cover rounded mb-4"
                        />
                        <h2 className="text-xl font-bold mb-2">{movie.title}</h2>
                        <p className="text-gray-600 mb-2">{movie.description}</p>
                        <div className="flex justify-between">
                            <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                                ⭐ {movie.rating}
                            </span>
                            <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                                {movie.duration} mins
                            </span>
                        </div>
                        <p className="text-sm mt-2 text-gray-700">
                            Status: {movie.status === 'now_showing' ? '🎬 Now Showing' : '📅 Coming Soon'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestAPI;