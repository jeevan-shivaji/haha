
import React, { useState } from 'react';
import { User, Mail, Phone, Shield, CreditCard, Bell, Save, Camera, CheckCircle2, Lock, Smartphone, Globe } from 'lucide-react';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'John Smith',
    email: 'john.smith@wealthmind.ai',
    phone: '+1 (555) 123-4567',
    role: 'Freelance Designer & Investor',
    location: 'New York, USA'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // In a real app, this would make an API call
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
             
             <div className="relative mt-12 mb-4 inline-block">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 p-1 mx-auto">
                    <div className="w-full h-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500">
                        JS
                    </div>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg hover:opacity-90 transition-opacity">
                    <Camera size={14} />
                </button>
             </div>
             
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{formData.role}</p>
             
             <div className="flex justify-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Pro Plan
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Verified
                </span>
             </div>

             <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-between text-sm">
                <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-white">12</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Months</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-white">85%</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Savings</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-white">4</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Goals</p>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
             <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-2">Upgrade to Premium</h3>
                 <p className="text-indigo-100 text-sm mb-4">Get AI advanced insights, unlimited transaction history, and priority support.</p>
                 <button className="w-full py-2 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                     View Plans
                 </button>
             </div>
             <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-slate-400" /> Personal Information
                    </h3>
                    <button 
                        onClick={() => isEditing ? document.getElementById('profile-form')?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true})) : setIsEditing(true)}
                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${isEditing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        {isEditing ? 'Save Changes' : 'Edit Details'}
                    </button>
                </div>
                
                <form id="profile-form" onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="tel" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Location</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <Shield size={20} className="text-slate-400" /> Security
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <Lock size={18} />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-slate-900 dark:text-white">Password</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Last changed 3 months ago</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400">Update</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <Smartphone size={18} />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-slate-900 dark:text-white">2-Factor Auth</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Enabled</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400">Configure</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <Bell size={20} className="text-slate-400" /> Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Transaction Alerts</span>
                            <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Weekly Summary</span>
                            <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Product Updates</span>
                            <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full relative cursor-pointer">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
