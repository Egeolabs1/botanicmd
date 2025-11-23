
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { X, CheckCircle } from './Icons';

interface PostEditorProps {
  post?: BlogPost;
  onSave: (post: Omit<BlogPost, 'id'> & { id?: number }) => void;
  onCancel: () => void;
}

export const PostEditor: React.FC<PostEditorProps> = ({ post, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'General',
    author: 'Admin',
    imageUrl: '',
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        imageUrl: post.imageUrl
      });
    }
  }, [post]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: post?.id,
      date: post?.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{post ? 'Edit Post' : 'New Post'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50"
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
             <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50"
             >
               <option>Care Guides</option>
               <option>Beginners</option>
               <option>Science</option>
               <option>Technology</option>
               <option>Wellness</option>
               <option>Design</option>
               <option>General</option>
             </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
           <input
              type="url"
              required
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50"
              placeholder="https://..."
            />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Excerpt (Short Summary)</label>
           <textarea
              required
              rows={2}
              value={formData.excerpt}
              onChange={e => setFormData({...formData, excerpt: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50"
            />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Content (HTML supported)</label>
           <textarea
              required
              rows={12}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50 font-mono text-sm"
              placeholder="<p>Write your content here...</p>"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Author</label>
             <input
                type="text"
                required
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 bg-gray-50"
              />
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold bg-nature-600 text-white hover:bg-nature-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Save Post
          </button>
        </div>
      </form>
    </div>
  );
};
