import React, { useState, useRef, useMemo } from 'react';
import { Student } from '../types';
import { Plus, Trash2, User, Phone, Camera, X, Filter, Users } from 'lucide-react';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentManager: React.FC<Props> = ({ students, setStudents }) => {
  // Form State
  const [formData, setFormData] = useState({
    grNo: '',
    rfidCardNo: '',
    name: '',
    fatherName: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    parentPhone: '',
    grade: '',
  });
  
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingStudentId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudents(prev => prev.map(s => 
            s.id === editingStudentId ? { ...s, photoUrl: reader.result as string } : s
        ));
        setEditingStudentId(null);
        if (editFileInputRef.current) editFileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const addStudent = () => {
    if (!formData.name || !formData.grNo || !formData.grade) {
        alert("Name, GR No, and Class are required!");
        return;
    }
    const newStudent: Student = {
      id: Date.now().toString(),
      ...formData,
      rfidCardNo: formData.rfidCardNo.trim() || `000${formData.grNo.trim()}`,
      photoUrl: newPhoto || undefined
    };
    setStudents([...students, newStudent]);
    // Reset form
    setFormData({
        grNo: '', rfidCardNo: '', name: '', fatherName: '', gender: 'Male', dob: '', parentPhone: '', grade: formData.grade
    });
    setNewPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStudent = (id: string) => {
    if(confirm("Are you sure you want to delete this student?")) {
        setStudents(students.filter(s => s.id !== id));
    }
  };

  const triggerEditPhoto = (id: string) => {
    setEditingStudentId(id);
    editFileInputRef.current?.click();
  };

  const removeStudentPhoto = (id: string) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, photoUrl: undefined } : s));
  };

  const updateStudentRfid = (id: string, rfidCardNo: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, rfidCardNo } : s));
  };

  // Filtering
  const uniqueGrades = useMemo(() => Array.from(new Set(students.map(s => s.grade))).sort(), [students]);
  
  const filteredStudents = useMemo(() => {
      let filtered = students;
      if (selectedGradeFilter !== 'All') {
          filtered = filtered.filter(s => s.grade === selectedGradeFilter);
      }
      // Sort by Grade then GR No
      return filtered.sort((a, b) => a.grade.localeCompare(b.grade) || a.grNo.localeCompare(b.grNo));
  }, [students, selectedGradeFilter]);

  return (
    <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 shadow-2xl min-h-[600px] text-cyber-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-3 uppercase tracking-wider">
          <Users className="w-6 h-6 text-cyber-500" />
          Student Registry & RFID Card Mapping
        </h2>
        
        {/* Class Filter */}
        <div className="flex items-center gap-2 bg-cyber-900/80 p-1 rounded-lg border border-cyber-700">
            <Filter className="w-4 h-4 text-cyber-500 ml-2" />
            <select 
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-none py-1 pr-8 pl-2 cursor-pointer"
            >
                <option value="All">All Classes</option>
                {uniqueGrades.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
        </div>
      </div>

      {/* Hidden Input for Edits */}
      <input type="file" ref={editFileInputRef} onChange={handleEditFileChange} accept="image/*" className="hidden" />

      {/* Add Form */}
      <div className="mb-8 bg-cyber-900/40 p-5 rounded-xl border border-cyber-700/50 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Photo */}
            <div className="md:col-span-1 flex justify-center">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl bg-cyber-800 border border-cyber-600 flex items-center justify-center cursor-pointer hover:border-cyber-400 transition-all overflow-hidden relative group"
                 >
                     {newPhoto ? (
                         <img src={newPhoto} className="w-full h-full object-cover" alt="Preview" />
                     ) : (
                         <Camera className="w-6 h-6 text-cyber-500 group-hover:scale-110 transition-transform" />
                     )}
                     {newPhoto && (
                         <div onClick={(e) => {e.stopPropagation(); setNewPhoto(null)}} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <X className="w-4 h-4 text-white" />
                         </div>
                     )}
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
            </div>

            {/* Fields */}
            <div className="md:col-span-2">
                <label className="text-xs text-cyber-400 font-mono uppercase">GR No.</label>
                <input name="grNo" value={formData.grNo} onChange={handleInputChange} placeholder="1001" className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none font-mono" />
            </div>
            <div className="md:col-span-2">
                <label className="text-xs text-amber-400 font-mono uppercase">🪪 RFID Serial No.</label>
                <input
                  name="rfidCardNo"
                  value={formData.rfidCardNo}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="Tap RFID Card..."
                  className="w-full bg-cyber-900 border border-amber-500/60 rounded px-3 py-2 text-amber-300 focus:border-amber-400 outline-none font-mono"
                />
            </div>
             <div className="md:col-span-2">
                <label className="text-xs text-cyber-400 font-mono uppercase">Class</label>
                <input name="grade" value={formData.grade} onChange={handleInputChange} placeholder="10-A" className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none font-mono" />
            </div>
            <div className="md:col-span-3">
                <label className="text-xs text-cyber-400 font-mono uppercase">Student Name</label>
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none" />
            </div>
            <div className="md:col-span-2">
                <label className="text-xs text-cyber-400 font-mono uppercase">Father Name</label>
                <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Robert Doe" className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none" />
            </div>
             <div className="md:col-span-3">
                <label className="text-xs text-cyber-400 font-mono uppercase">Father Mobile (GSM SMS)</label>
                <input name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} placeholder="+92300..." className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none font-mono" />
            </div>
             <div className="md:col-span-2">
                <label className="text-xs text-cyber-400 font-mono uppercase">DOB</label>
                <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none font-mono text-sm" />
            </div>
            <div className="md:col-span-2">
                <label className="text-xs text-cyber-400 font-mono uppercase">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-cyber-900 border border-cyber-700 rounded px-3 py-2 text-white focus:border-cyber-500 outline-none">
                    <option>Male</option>
                    <option>Female</option>
                </select>
            </div>

            <div className="md:col-span-3">
                <button onClick={addStudent} className="w-full bg-cyber-500 hover:bg-cyber-400 text-white font-bold py-2.5 rounded shadow-neon transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> ADD STUDENT & RFID CARD
                </button>
            </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto rounded-xl border border-cyber-700 bg-cyber-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cyber-900/80 text-cyber-400 text-xs uppercase font-mono border-b border-cyber-700 tracking-wider">
              <th className="py-4 px-4 w-16">SN</th>
              <th className="py-4 px-2 w-20">GR No</th>
              <th className="py-4 px-2 w-40">🪪 RFID Card Serial</th>
              <th className="py-4 px-2 w-20">Class</th>
              <th className="py-4 px-2">Student Details</th>
              <th className="py-4 px-2">Guardian (GSM SMS)</th>
              <th className="py-4 px-2">Personal</th>
              <th className="py-4 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-800">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-cyber-600 font-mono">
                  NO DATA FOUND
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, index) => (
                <tr key={s.id} className="hover:bg-cyber-800/50 transition-colors group">
                  <td className="py-4 px-4 font-mono text-cyber-600">{index + 1}</td>
                  <td className="py-4 px-2 font-mono text-white">{s.grNo}</td>
                  <td className="py-4 px-2">
                    <input
                      value={s.rfidCardNo || ''}
                      onChange={(e) => updateStudentRfid(s.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      placeholder="Click & Tap Card"
                      className="w-36 bg-cyber-950 border border-amber-500/40 focus:border-amber-400 rounded px-2.5 py-1 text-xs font-mono text-amber-300 outline-none"
                    />
                  </td>
                  <td className="py-4 px-2">
                    <span className="px-2 py-1 rounded bg-cyber-900 border border-cyber-700 text-xs font-mono text-cyber-400">
                        {s.grade}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                        {/* Photo Avatar with Edit/Remove Logic */}
                        <div 
                            className="relative w-10 h-10 flex-shrink-0 cursor-pointer group/photo"
                            onClick={() => triggerEditPhoto(s.id)}
                            title="Click to change photo"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyber-800 border border-cyber-600 overflow-hidden flex items-center justify-center">
                                {s.photoUrl ? (
                                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-cyber-600" />
                                )}
                            </div>
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-4 h-4 text-white" />
                            </div>

                            {/* Remove Button */}
                            {s.photoUrl && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); removeStudentPhoto(s.id); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer z-10 shadow-sm"
                                    title="Remove photo"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <div className="font-bold text-white text-sm">{s.name}</div>
                            <div className="text-[10px] text-cyber-500 uppercase tracking-wider">ID: {s.id.slice(-4)}</div>
                        </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-cyber-300">{s.fatherName}</div>
                    <div className="flex items-center gap-1 text-xs text-cyber-500 font-mono">
                        <Phone className="w-3 h-3" /> {s.parentPhone}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-xs text-cyber-400">{s.gender}</div>
                    <div className="text-xs text-cyber-500 font-mono">{s.dob}</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button 
                        onClick={() => removeStudent(s.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/20 p-2 rounded transition-colors"
                        title="Delete Student"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManager;