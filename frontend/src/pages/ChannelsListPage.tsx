import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { CircularProgress, Pagination } from '@mui/material';
import { Search } from 'lucide-react';
import api from '../api';
import type { Channel, PaginatedResponse } from '../types';
import { useDebounce } from 'use-debounce';

const ChannelsListPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Channel>>('/channels', {
        params: { page, limit: 12, search: debouncedSearchTerm || undefined },
      });
      setChannels(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      // toast.error('Kanallarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);
  
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return (
    <div className="space-y-6">
      {/* Header va Search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Barcha Kanallar
        </h1>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:placeholder-gray-400 dark:text-white"
            placeholder="Kanallarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Loading state */}
      {loading && channels.length === 0 ? (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      ) : (
        /* Channels Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {channels.map(channel => (
            <div key={channel.id} className="group">
              <RouterLink
                to={`/channels/${channel.linkName}`}
                className="block h-full"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm 
                               border border-gray-200 dark:border-gray-700
                               hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600
                               transition-all duration-300 ease-in-out
                               group-hover:scale-[1.02] h-full">
                  
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {channel.logoImage ? (
                        <img
                          src={`http://localhost:5000/public${channel.logoImage}`}
                          alt={channel.name}
                          className="object-cover border-2 border-gray-200 rounded-full w-14 h-14 dark:border-gray-600"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-xl font-bold text-white rounded-full w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600">
                          {channel.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate transition-colors duration-200 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {channel.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        @{channel.linkName}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {channel._count?.followers || 0} obunachi
                      </p>
                    </div>
                  </div>
                  
                  {/* Bio (agar mavjud bo'lsa) */}
                  {channel.bio && (
                    <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
                      {channel.bio}
                    </p>
                  )}
                </div>
              </RouterLink>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && channels.length === 0 && (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-700">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Hech qanday kanal topilmadi
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Boshqa qidiruv so'zini sinab ko'ring
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, value) => setPage(value)} 
            color="primary"
            size="large"
          />
        </div>
      )}
    </div>
  );
};

export default ChannelsListPage;