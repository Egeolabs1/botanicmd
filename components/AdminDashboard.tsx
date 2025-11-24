
import React, { useState, useEffect } from 'react';
import { BlogPost, User as UserType, PlanType } from '../types';
import { blogService } from '../services/blogService';
import { adminService } from '../services/adminService';
import { generateBlogPost } from '../services/geminiService';
import { useLanguage } from '../i18n';
import { LayoutDashboard, Plus, Edit, Trash, ArrowRight, User, FileDown, Users, CreditCard, CheckCircle, Star, Search, Zap } from './Icons';
import { PostEditor } from './PostEditor';
import { trackingService, TrackingConfig } from '../services/trackingService';

interface AdminDashboardProps {
  onExit: () => void;
}

type Tab = 'dashboard' | 'posts' | 'users' | 'seo';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Blog State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<BlogPost | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserType[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // SEO & Tracking State
  const [trackingConfig, setTrackingConfig] = useState<TrackingConfig>(trackingService.getConfig());
  const [isSaving, setIsSaving] = useState(false);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setPosts(blogService.getPosts());
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await adminService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      // Fallback para modo local
      setUsers(adminService.getUsersSync());
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // --- Blog Handlers ---
  const handleCreatePost = () => {
    setCurrentPost(undefined);
    setIsEditingPost(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setCurrentPost(post);
    setIsEditingPost(true);
  };

  const handleDeletePost = (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      blogService.deletePost(id);
      loadData();
    }
  };

  const handleSavePost = (postData: Omit<BlogPost, 'id'> & { id?: number }) => {
    // If ID is 0 (draft from AI), treat as new post (undefined ID)
    const dataToSave = { ...postData };
    if (dataToSave.id === 0) {
      delete dataToSave.id;
    }

    blogService.savePost(dataToSave);
    setIsEditingPost(false);
    loadData();
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    try {
      // Force 'en' to ensure original content is in English
      const newPostData = await generateBlogPost('en');
      
      // Create a draft object. ID 0 indicates it's a new, unsaved draft.
      const draftPost: BlogPost = {
        id: 0, 
        ...newPostData,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      };

      // Instead of saving immediately, open the editor for approval
      setCurrentPost(draftPost);
      setIsEditingPost(true);
      
    } catch (error) {
      console.error(error);
      alert("Failed to generate post. Please check API Key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- User Handlers ---
  const handlePlanChange = async (userId: string, newPlan: string) => {
    try {
      await adminService.updateUserPlan(userId, newPlan as PlanType);
      loadData(); // Refresh list
    } catch (e: any) {
      console.error(e);
      alert(`Failed to update plan: ${e.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        loadData();
      } catch (e: any) {
        console.error(e);
        alert(`Failed to delete user: ${e.message || 'Erro desconhecido'}`);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // --- SEO & Tracking Handlers ---
  const handleSaveTracking = () => {
    setIsSaving(true);
    try {
      trackingService.saveConfig(trackingConfig);
      alert('Configurações salvas com sucesso! As mudanças serão aplicadas na próxima recarga.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackingChange = (field: keyof TrackingConfig, value: string) => {
    setTrackingConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // --- Renderers ---

  if (isEditingPost) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
           <div className="mb-6 flex items-center gap-2">
             <button onClick={() => setIsEditingPost(false)} className="text-sm text-gray-500 hover:text-nature-600 font-medium">Dashboard</button>
             <span className="text-gray-300">/</span>
             <span className="text-sm text-gray-900 font-medium">{currentPost ? (currentPost.id === 0 ? 'Review AI Draft' : 'Edit Post') : 'New Post'}</span>
           </div>
           <PostEditor post={currentPost} onSave={handleSavePost} onCancel={() => setIsEditingPost(false)} />
        </div>
      </div>
    );
  }

  const stats = {
    posts: posts.length,
    users: users.length,
    proUsers: users.filter(u => u.plan === 'pro').length,
    freeUsers: users.filter(u => u.plan === 'free').length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
           <div className="flex items-center gap-2 text-nature-700 font-bold text-xl">
             <LayoutDashboard className="w-6 h-6" /> Admin Panel
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-nature-50 text-nature-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-nature-50 text-nature-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <Users className="w-5 h-5" /> Users & Plans
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'posts' ? 'bg-nature-50 text-nature-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <Edit className="w-5 h-5" /> Blog Content
          </button>
          <button 
            onClick={() => setActiveTab('seo')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'seo' ? 'bg-nature-50 text-nature-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <Search className="w-5 h-5" /> SEO & Tracking
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
             <div className="w-8 h-8 bg-nature-100 rounded-full flex items-center justify-center text-nature-700 font-bold text-xs">AD</div>
             <div className="text-sm">
                <p className="font-bold text-gray-900">Administrator</p>
                <p className="text-gray-500 text-xs">Super Access</p>
             </div>
          </div>
          <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
             <ArrowRight className="w-4 h-4 rotate-180" /> Exit to App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Mobile */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex md:hidden justify-between items-center sticky top-0 z-30">
           <div className="font-bold text-nature-700">Admin Panel</div>
           <button onClick={onExit} className="text-sm text-gray-500">Exit</button>
        </header>

        {/* Mobile Nav */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
           {['dashboard', 'users', 'posts', 'seo'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === tab ? 'bg-nature-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {tab === 'seo' ? 'SEO' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
           ))}
        </div>

        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-8 h-8" /></div>
                   <div>
                      <p className="text-gray-500 text-sm font-bold uppercase">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                   <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl"><Star className="w-8 h-8" /></div>
                   <div>
                      <p className="text-gray-500 text-sm font-bold uppercase">Pro Subscribers</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.proUsers}</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                   <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Edit className="w-8 h-8" /></div>
                   <div>
                      <p className="text-gray-500 text-sm font-bold uppercase">Blog Posts</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.posts}</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                       <button onClick={() => setActiveTab('users')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                          <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-lg shadow-sm"><Users className="w-5 h-5 text-gray-600"/></div>
                             <span className="font-medium">Manage Users</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                       </button>
                       <button onClick={handleCreatePost} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                          <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-lg shadow-sm"><Edit className="w-5 h-5 text-gray-600"/></div>
                             <span className="font-medium">Write New Article</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                       </button>
                        <button onClick={handleGeneratePost} disabled={isGenerating} className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl transition-colors text-left">
                          <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-lg shadow-sm text-purple-600">
                               {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div> : <Zap className="w-5 h-5"/>}
                             </div>
                             <span className="font-medium text-purple-800">
                               {isGenerating ? 'Generating Content...' : 'Generate Post with AI'}
                             </span>
                          </div>
                          {!isGenerating && <ArrowRight className="w-4 h-4 text-purple-400" />}
                       </button>
                    </div>
                 </div>
                 
                 <div className="bg-nature-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="font-bold text-xl mb-2">Admin Note</h3>
                      <p className="text-nature-100 mb-6">Remember to check user feedback and update the "Recommended" section in the CMS weekly.</p>
                      <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg">
                         <CheckCircle className="w-4 h-4" /> System Operational
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-y-10 translate-x-10"></div>
                 </div>
              </div>
            </div>
          )}

          {/* USERS VIEW */}
          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-500">Manage access, plans, and user accounts.</p>
                </div>
                <div className="relative w-full md:w-64">
                   <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                   <input 
                     type="text" 
                     placeholder="Search users..." 
                     value={userSearch}
                     onChange={(e) => setUserSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 focus:border-transparent"
                   />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Plan Status</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Usage</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Admin Control</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-nature-500 border-t-transparent rounded-full animate-spin"></div>
                              Carregando usuários do Supabase...
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            {users.length === 0 
                              ? "Nenhum usuário encontrado. Os usuários aparecerão aqui após fazerem login."
                              : "Nenhum usuário encontrado com essa busca."}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-nature-100 flex items-center justify-center text-nature-700 font-bold text-xs">
                                    {user.name.substring(0,2).toUpperCase()}
                                 </div>
                                 <div>
                                    <div className="font-bold text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email || user.id}</div>
                                 </div>
                              </div>
                          </td>
                          <td className="p-4">
                             {user.plan === 'pro' ? (
                               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200">
                                 <Star className="w-3 h-3 fill-yellow-800" /> PRO
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                                 FREE
                               </span>
                             )}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                             <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                   <div className={`h-full rounded-full ${user.plan === 'pro' ? 'bg-yellow-400' : 'bg-nature-500'}`} style={{ width: user.plan === 'pro' ? '100%' : `${(user.usageCount/3)*100}%` }}></div>
                                </div>
                                <span>{user.usageCount} / {user.maxUsage === -1 ? '∞' : user.maxUsage}</span>
                             </div>
                          </td>
                          <td className="p-4">
                             <select 
                               value={user.plan} 
                               onChange={(e) => handlePlanChange(user.id, e.target.value)}
                               className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-nature-500 outline-none"
                             >
                               <option value="free">Free Plan</option>
                               <option value="pro">Pro Plan</option>
                             </select>
                          </td>
                          <td className="p-4 text-right">
                             <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove User">
                                <Trash className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* POSTS VIEW */}
          {activeTab === 'posts' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900">Blog Content</h1>
                   <p className="text-gray-500">Manage your educational articles.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleGeneratePost} disabled={isGenerating} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                      {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Zap className="w-4 h-4" />}
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                    <button onClick={handleCreatePost} className="bg-nature-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-nature-700 transition-colors shadow-lg shadow-nature-200">
                      <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-50 border-b border-gray-100">
                       <th className="p-4 font-semibold text-gray-600 text-sm">Title</th>
                       <th className="p-4 font-semibold text-gray-600 text-sm">Category</th>
                       <th className="p-4 font-semibold text-gray-600 text-sm">Author</th>
                       <th className="p-4 font-semibold text-gray-600 text-sm">Date</th>
                       <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {posts.map(post => (
                       <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                         <td className="p-4">
                            <div className="font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                         </td>
                         <td className="p-4">
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{post.category}</span>
                         </td>
                         <td className="p-4 text-sm text-gray-600">{post.author}</td>
                         <td className="p-4 text-sm text-gray-500">{post.date}</td>
                         <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => handleEditPost(post)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                               <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                               <Trash className="w-4 h-4" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                </div>
              </div>
            </div>
          )}

          {/* SEO & TRACKING VIEW */}
          {activeTab === 'seo' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">SEO & Tracking</h1>
                  <p className="text-gray-500 mt-1">Configure códigos de verificação e analytics</p>
                </div>
                <button
                  onClick={handleSaveTracking}
                  disabled={isSaving}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>

              <div className="space-y-6">
                {/* Google Services */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    Google Services
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Google Search Console - Verification Code
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.googleSearchConsole || ''}
                        onChange={(e) => handleTrackingChange('googleSearchConsole', e.target.value)}
                        placeholder="Ex: 1234567890abcdef"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cole apenas o código, sem as tags HTML
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Google Analytics 4 - Measurement ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.googleAnalytics || ''}
                        onChange={(e) => handleTrackingChange('googleAnalytics', e.target.value)}
                        placeholder="Ex: G-XXXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Encontre em: Google Analytics → Admin → Data Streams
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Google Tag Manager - Container ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.googleTagManager || ''}
                        onChange={(e) => handleTrackingChange('googleTagManager', e.target.value)}
                        placeholder="Ex: GTM-XXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Encontre em: Google Tag Manager → Admin → Container ID
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media Pixels */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6 text-purple-600" />
                    Social Media Tracking
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Facebook Pixel ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.facebookPixel || ''}
                        onChange={(e) => handleTrackingChange('facebookPixel', e.target.value)}
                        placeholder="Ex: 1234567890123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Encontre em: Facebook Events Manager → Data Sources → Pixel
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        TikTok Pixel ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.tiktokPixel || ''}
                        onChange={(e) => handleTrackingChange('tiktokPixel', e.target.value)}
                        placeholder="Ex: ABCDEFGHIJ1234567890"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Encontre em: TikTok Ads Manager → Assets → Events
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LinkedIn Insight Tag - Partner ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.linkedInInsight || ''}
                        onChange={(e) => handleTrackingChange('linkedInInsight', e.target.value)}
                        placeholder="Ex: 1234567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Encontre em: LinkedIn Campaign Manager → Account Assets → Insight Tag
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics & Heatmaps */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-orange-600" />
                    User Behavior Analytics
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hotjar Site ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.hotjar || ''}
                        onChange={(e) => handleTrackingChange('hotjar', e.target.value)}
                        placeholder="Ex: 1234567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Para heatmaps e recordings. Encontre em: Hotjar → Sites & Organizations
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Microsoft Clarity - Project ID
                      </label>
                      <input
                        type="text"
                        value={trackingConfig.clarity || ''}
                        onChange={(e) => handleTrackingChange('clarity', e.target.value)}
                        placeholder="Ex: abcdefgh12"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Grátis da Microsoft. Encontre em: Clarity → Settings → Setup
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Scripts */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Edit className="w-6 h-6 text-gray-600" />
                    Custom Scripts
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Custom Header Scripts ({"<head>"})
                      </label>
                      <textarea
                        value={trackingConfig.customHeader || ''}
                        onChange={(e) => handleTrackingChange('customHeader', e.target.value)}
                        placeholder="Cole aqui qualquer código HTML/JS que deve ir no <head>"
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Será inserido no {"<head>"}. Útil para scripts de verificação ou tracking customizado.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Custom Body Scripts ({"<body>"})
                      </label>
                      <textarea
                        value={trackingConfig.customBody || ''}
                        onChange={(e) => handleTrackingChange('customBody', e.target.value)}
                        placeholder="Cole aqui qualquer código HTML/JS que deve ir no <body>"
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Será inserido no {"<body>"}. Útil para widgets, chatbots, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    ℹ️ Informações Importantes
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>As configurações são salvas localmente no navegador</li>
                    <li>Após salvar, a página será recarregada para aplicar as mudanças</li>
                    <li>Os códigos de tracking são carregados apenas no frontend (client-side)</li>
                    <li>Para remover um serviço, basta limpar o campo e salvar</li>
                    <li>Certifique-se de ter os termos de privacidade atualizados ao usar tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
