import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowRight, Calendar, User, Clock, Leaf } from './Icons';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { BlogPost } from '../types';
import { blogService } from '../services/blogService';
import { SEOHead, blogPostSchema } from './SEOHead';
import { generateUniqueSlug } from '../utils/slug';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const posts = await blogService.getPosts();
        
        // Encontra o post pelo slug ou ID
        const foundPost = posts.find(p => {
          const postSlug = p.slug || generateUniqueSlug(p.title, p.id);
          return postSlug === slug || p.id.toString() === slug;
        });

        if (foundPost) {
          // Garante que o post tem slug
          if (!foundPost.slug) {
            foundPost.slug = generateUniqueSlug(foundPost.title, foundPost.id);
          }
          setPost(foundPost);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Erro ao carregar post:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  const handleBack = () => {
    if (location.state?.from === '/app' || isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/blog');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando post...</p>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-50">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post não encontrado</h1>
          <p className="text-gray-600 mb-6">O post que você está procurando não existe ou foi removido.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-nature-600 text-white rounded-lg hover:bg-nature-700 transition-colors"
          >
            Voltar ao Blog
          </button>
        </div>
      </div>
    );
  }

  // Gera structured data para SEO
  const structuredData = blogPostSchema(
    post.title,
    post.excerpt,
    post.author,
    post.date,
    post.imageUrl
  );

  // URL canônica do post
  const postUrl = `https://botanicmd.com/blog/${post.slug}`;

  return (
    <>
      <SEOHead
        title={`${post.title} | BotanicMD Blog`}
        description={post.excerpt}
        keywords={`${post.category}, plantas, jardinagem, ${post.title.toLowerCase()}`}
        image={post.imageUrl}
        url={postUrl}
        type="article"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-white animate-fade-in font-sans">
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
              <ArrowRight className="w-5 h-5 rotate-180" /> {t('back_home')}
            </button>
          </div>
        </div>

        <article>
          {/* Hero Image */}
          <div className="relative h-[50vh] min-h-[400px]">
            <img 
              src={post.imageUrl} 
              className="w-full h-full object-cover" 
              alt={post.title}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-4xl mx-auto">
              <span className="bg-nature-600 text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 inline-block">
                {post.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{post.title}</h1>
              <div className="flex items-center gap-6 text-gray-200 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" /> {post.author}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> {post.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> 5 min read
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-24">
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, { 
                ALLOWED_TAGS: ['h3', 'p', 'ul', 'li', 'ol', 'strong', 'em', 'a'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
              }) }}
            />
            
            <hr className="my-16 border-gray-200" />
            
            <button 
              onClick={handleBack} 
              className="flex items-center gap-2 font-semibold text-nature-600 hover:text-nature-700 transition-colors text-lg mb-8"
            >
              <ArrowRight className="w-5 h-5 rotate-180" /> Voltar ao Blog
            </button>
          </div>
          
          <style>{`
            .blog-content {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            }
            
            .blog-content > *:first-child {
              margin-top: 0 !important;
            }
            
            .blog-content > *:last-child {
              margin-bottom: 0 !important;
            }
            
            /* Parágrafos */
            .blog-content p {
              margin-top: 1.75rem;
              margin-bottom: 1.75rem;
              font-size: 1.125rem;
              line-height: 1.9;
              color: #374151;
              font-weight: 400;
              letter-spacing: -0.01em;
            }
            
            /* Títulos H3 */
            .blog-content h3 {
              margin-top: 3rem;
              margin-bottom: 1.5rem;
              font-size: 1.875rem;
              font-weight: 700;
              line-height: 1.25;
              color: #111827;
              letter-spacing: -0.025em;
            }
            
            .blog-content h3:first-of-type {
              margin-top: 2rem;
            }
            
            /* Listas */
            .blog-content ul,
            .blog-content ol {
              margin-top: 1.75rem;
              margin-bottom: 1.75rem;
              padding-left: 2rem;
              list-style-position: outside;
            }
            
            .blog-content ul {
              list-style-type: disc;
            }
            
            .blog-content ol {
              list-style-type: decimal;
            }
            
            .blog-content li {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 0.75rem;
              line-height: 1.8;
              color: #374151;
              font-size: 1.125rem;
            }
            
            .blog-content li::marker {
              color: #22c55e;
              font-weight: 700;
              font-size: 1.2em;
            }
            
            /* Texto em negrito */
            .blog-content strong {
              font-weight: 700;
              color: #111827;
              letter-spacing: -0.01em;
            }
            
            /* Texto em itálico */
            .blog-content em {
              font-style: italic;
              color: #4b5563;
            }
            
            /* Links */
            .blog-content a {
              color: #22c55e;
              text-decoration: underline;
              text-underline-offset: 4px;
              text-decoration-thickness: 2px;
              transition: all 0.2s ease;
              font-weight: 500;
            }
            
            .blog-content a:hover {
              color: #16a34a;
              text-decoration-thickness: 3px;
            }
            
            /* Espaçamento entre seções */
            .blog-content h3 + p {
              margin-top: 1.5rem;
            }
            
            /* Responsivo */
            @media (max-width: 768px) {
              .blog-content p {
                font-size: 1rem;
                line-height: 1.8;
                margin-top: 1.5rem;
                margin-bottom: 1.5rem;
              }
              
              .blog-content h3 {
                font-size: 1.5rem;
                margin-top: 2.5rem;
                margin-bottom: 1.25rem;
                line-height: 1.3;
              }
              
              .blog-content h3:first-of-type {
                margin-top: 1.5rem;
              }
              
              .blog-content li {
                font-size: 1rem;
                line-height: 1.75;
                margin-top: 0.875rem;
                margin-bottom: 0.875rem;
              }
              
              .blog-content ul,
              .blog-content ol {
                padding-left: 1.5rem;
                margin-top: 1.5rem;
                margin-bottom: 1.5rem;
              }
            }
            
            /* Melhorias de legibilidade */
            @media (min-width: 1024px) {
              .blog-content {
                font-size: 1.125rem;
              }
              
              .blog-content p {
                max-width: 65ch;
              }
            }
          `}</style>
        </article>
      </div>
    </>
  );
};

