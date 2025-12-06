import React, { useState } from 'react';
import { BusRoute, Student } from '../types';
import { Bus, Phone, Users, MapPin, Plus, Edit2, Trash2, X, Upload, User } from 'lucide-react';
import { compressImage } from '../utils/storage';

interface TransportProps {
  routes: BusRoute[];
  students: Student[];
  onAddRoute: (route: Omit<BusRoute, 'id'>) => void;
  onUpdateRoute: (route: BusRoute) => void;
  onDeleteRoute: (id: string) => void;
}

export const Transport: React.FC<TransportProps> = ({ routes, students, onAddRoute, onUpdateRoute, onDeleteRoute }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  
  const [formData, setFormData] = useState({
    routeName: '',
    driverName: '',
    driverPhone: '',
    vehicleNo: '',
    monthlyFee: 0,
    driverPhoto: ''
  });

  const handleAddNew = () => {
    setEditingRoute(null);
    setFormData({
      routeName: '',
      driverName: '',
      driverPhone: '',
      vehicleNo: '',
      monthlyFee: 0,
      driverPhoto: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (route: BusRoute) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      driverName: route.driverName,
      driverPhone: route.driverPhone,
      vehicleNo: route.vehicleNo,
      monthlyFee: route.monthlyFee,
      driverPhoto: route.driverPhoto || ''
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, driverPhoto: compressedBase64 });
      } catch (error) {
        console.error("Image upload failed", error);
        alert("Failed to process image.");
      }
    }
  };
  
  const removePhoto = () => {
    setFormData({ ...formData, driverPhoto: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoute) {
      onUpdateRoute({ ...editingRoute, ...formData });
    } else {
      onAddRoute(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this route? Students assigned to this route will need to be reassigned.")) {
      onDeleteRoute(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => {
          const studentCount = students.filter(s => s.busRouteId === route.id).length;
          return (
            <div key={route.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Bus size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{route.routeName}</h3>
                    <p className="text-xs text-slate-500">{route.vehicleNo}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(route)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(route.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500">Monthly Fee</span>
                   <span className="font-bold text-slate-800">₹{route.monthlyFee}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Users size={16} className="text-slate-400" />
                  <span>{studentCount} Students Assigned</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                   {route.driverPhoto ? (
                      <img src={route.driverPhoto} alt={route.driverName} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                   ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                   )}
                   <div className="flex-1">
                      <div className="font-medium text-slate-900">{route.driverName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={10} /> {route.driverPhone}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <button 
          onClick={handleAddNew}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors h-full min-h-[200px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Add New Route</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingRoute ? 'Edit Route' : 'Add New Route'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Driver Photo Upload */}
               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                  {formData.driverPhoto ? (
                    <img src={formData.driverPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-400" size={28} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Photo</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1">
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                     {formData.driverPhoto && (
                      <button type="button" onClick={removePhoto} className="text-red-500 p-1.5 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Route Name</label>
                <input required type="text" className="w-full border rounded-lg p-2 text-sm" 
                  value={formData.routeName} onChange={e => setFormData({...formData, routeName: e.target.value})} placeholder="e.g. Route A - North" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Number</label>
                <input required type="text" className="w-full border rounded-lg p-2 text-sm" 
                  value={formData.vehicleNo} onChange={e => setFormData({...formData, vehicleNo: e.target.value})} placeholder="e.g. KA-39-1234" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" 
                    value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input required type="tel" className="w-full border rounded-lg p-2 text-sm" 
                    value={formData.driverPhone} onChange={e => setFormData({...formData, driverPhone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Fee (₹)</label>
                <input required type="number" className="w-full border rounded-lg p-2 text-sm" 
                  value={formData.monthlyFee} onChange={e => setFormData({...formData, monthlyFee: parseFloat(e.target.value)})} />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};