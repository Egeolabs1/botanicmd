
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Leaf, ArrowRight, Calendar, User, Clock, X } from './Icons';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { BlogPost } from '../types';
import { blogService } from '../services/blogService';

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const handleBack = () => {
    // Se veio do /app, volta para /app, senão vai para landing
    if (location.state?.from === '/app' || isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/');
    }
  };
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await blogService.getPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Erro ao carregar posts:', error);
        // Fallback para array vazio
        setPosts([]);
      }
    };
    loadPosts();
  }, []);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-white animate-fade-in font-sans">
        <button 
          onClick={() => setSelectedPost(null)}
          className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur shadow-lg p-3 rounded-full hover:bg-gray-100 transition-all"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>

        <div className="relative h-[50vh] min-h-[400px]">
          <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt={selectedPost.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-4xl mx-auto">
             <span className="bg-nature-600 text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 inline-block">
               {selectedPost.category}
             </span>
             <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{selectedPost.title}</h1>
             <div className="flex items-center gap-6 text-gray-200 text-sm md:text-base">
               <div className="flex items-center gap-2"><User className="w-5 h-5" /> {selectedPost.author}</div>
               <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {selectedPost.date}</div>
               <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> 5 min read</div>
             </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16">
          <div 
            className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content, { 
              ALLOWED_TAGS: ['h3', 'p', 'ul', 'li', 'ol', 'strong', 'em', 'a'],
              ALLOWED_ATTR: ['href', 'target', 'rel']
            }) }}
          />
          
          <hr className="my-12 border-gray-100" />
          
          <button 
            onClick={() => setSelectedPost(null)} 
            className="flex items-center gap-2 font-bold text-nature-600 hover:text-nature-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180" /> Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBack}>
            <div className="bg-nature-600 text-white p-2 rounded-xl">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-nature-900">{t('app_name')} <span className="text-gray-400 font-medium">| Blog</span></span>
          </div>
          <button 
            onClick={handleBack} 
            className="text-gray-600 hover:text-nature-600 font-medium flex items-center gap-2 transition-colors"
          >
            {t('back_home')}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="text-center mb-16">
           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">{t('blog_title')}</h1>
           <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t('blog_subtitle')}</p>
        </div>

        {/* Featured Post (First one) */}
        {posts.length > 0 && (
          <div className="mb-16">
             <div 
               onClick={() => setSelectedPost(posts[0])}
               className="relative rounded-[2rem] overflow-hidden bg-gray-900 group cursor-pointer h-[500px]"
             >
                <img src={posts[0].imageUrl} alt={posts[0].title} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-3xl">
                   <span className="bg-nature-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                      {posts[0].category}
                   </span>
                   <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{posts[0].title}</h2>
                   <p className="text-gray-200 text-lg mb-6 line-clamp-2">{posts[0].excerpt}</p>
                   
                   <div className="flex items-center gap-6 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                         <User className="w-4 h-4" /> {posts[0].author}
                      </div>
                      <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4" /> {posts[0].date}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {posts.slice(1).map((post) => (
             <article 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer"
             >
                <div className="h-56 overflow-hidden relative">
                   <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                      {post.category}
                   </span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                   <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-nature-600 transition-colors leading-snug">
                      {post.title}
                   </h3>
                   <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {post.excerpt}
                   </p>
                   
                   <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                      <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                         {post.date}
                      </div>
                      <span className="text-nature-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                         {t('read_more')} <ArrowRight className="w-4 h-4" />
                      </span>
                   </div>
                </div>
             </article>
           ))}
        </div>

      </main>
      
      <footer className="bg-white py-12 border-t border-gray-200 mt-12 text-center">
         <div className="flex items-center justify-center gap-2 mb-4 text-nature-600">
            <Leaf className="w-6 h-6" />
            <span className="font-bold text-xl text-gray-900">{t('app_name')}</span>
         </div>
         <p className="text-gray-500 text-sm">© {new Date().getFullYear()} BotanicMD AI. Desenvolvido com ♥ por Egeolabs.</p>
      </footer>
    </div>
  );
};
