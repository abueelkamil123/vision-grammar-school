import React, { useMemo, useState } from 'react';
import { Student, AttendanceData, AttendanceStatus, DailyRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Mail, History, ArrowLeft, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  students: Student[];
  attendanceData: AttendanceData;
}

const COLORS = {
    present: '#10b981', // emerald-500
    absent: '#ef4444', // red-500
    leave: '#eab308', // yellow-500
    bg: '#1e293b',
    text: '#94a3b8'
};

const Reports: React.FC<Props> = ({ students, attendanceData }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');

  // Filter Logic
  const uniqueGrades = useMemo(() => Array.from(new Set(students.map(s => s.grade))).sort(), [students]);
  const filteredStudents = useMemo(() => {
      return selectedGradeFilter === 'All' ? students : students.filter(s => s.grade === selectedGradeFilter);
  }, [students, selectedGradeFilter]);

  const stats = useMemo(() => {
    let present = 0, absent = 0, leave = 0;
    filteredStudents.forEach(s => {
      const studentRecords = attendanceData[s.id] || {};
      (Object.values(studentRecords) as DailyRecord[]).forEach(record => {
        if (record.date.startsWith(selectedMonth)) {
           if (record.status === AttendanceStatus.PRESENT) present++;
           else if (record.status === AttendanceStatus.ABSENT) absent++;
           else if (record.status === AttendanceStatus.ON_LEAVE) leave++;
        }
      });
    });
    return [
      { name: 'Present', value: present, color: COLORS.present },
      { name: 'Absent', value: absent, color: COLORS.absent },
      { name: 'On Leave', value: leave, color: COLORS.leave },
    ];
  }, [filteredStudents, attendanceData, selectedMonth]);

  const studentDetails = useMemo(() => {
      return filteredStudents.map(s => {
          const records = (Object.values(attendanceData[s.id] || {}) as DailyRecord[]).filter(r => r.date.startsWith(selectedMonth));
          const presentCount = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
          const absentCount = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
          const leaveCount = records.filter(r => r.status === AttendanceStatus.ON_LEAVE).length;
          const totalDays = presentCount + absentCount + leaveCount;
          const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

          return { ...s, presentCount, absentCount, leaveCount, percentage };
      })
  }, [filteredStudents, attendanceData, selectedMonth]);

  // Detail View
  if (viewingStudentId) {
      const student = students.find(s => s.id === viewingStudentId);
      if (!student) return null;
      const records = attendanceData[student.id] || {};
      const sortedDates = Object.keys(records).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const present = (Object.values(records) as DailyRecord[]).filter(r => r.status === AttendanceStatus.PRESENT).length;
      const total = sortedDates.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return (
        <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 text-cyber-100 animate-in fade-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setViewingStudentId(null)} className="flex items-center gap-2 text-cyber-400 hover:text-cyber-100 transition-colors font-mono uppercase text-sm">
                    <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-cyber-900/50 p-6 rounded-2xl border border-cyber-700 flex flex-col sm:flex-row items-center gap-6">
                     <div className="w-24 h-24 rounded-lg bg-cyber-800 border-2 border-cyber-500 overflow-hidden shadow-neon">
                        {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-cyber-600 text-2xl font-bold">{student.grade}</div>}
                     </div>
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-2">{student.name}</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-cyber-400 font-mono">
                            <span>GR No: <span className="text-white">{student.grNo}</span></span>
                            <span>Class: <span className="text-white">{student.grade}</span></span>
                            <span>Father: <span className="text-white">{student.fatherName}</span></span>
                            <span>Mobile: <span className="text-white">{student.parentPhone}</span></span>
                        </div>
                    </div>
                </div>

                <div className="bg-cyber-900/50 p-6 rounded-2xl border border-cyber-700 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyber-500/20 rounded-full blur-2xl"></div>
                    <span className="text-cyber-400 font-mono text-xs uppercase tracking-widest">Attendance Rate</span>
                    <span className="text-4xl font-bold text-cyber-500 my-2 font-mono">{rate}%</span>
                    <div className="w-full bg-cyber-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyber-500 h-full shadow-neon" style={{ width: `${rate}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-cyber-700 bg-cyber-900/30">
                <table className="w-full text-left text-sm">
                    <thead className="bg-cyber-900 text-cyber-400 font-mono uppercase text-xs">
                        <tr><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Check-in</th></tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-800">
                        {sortedDates.map(date => {
                            const record = records[date];
                            return (
                                <tr key={date} className="hover:bg-cyber-800/50">
                                    <td className="p-4 font-mono text-white">{date}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-bold border uppercase ${
                                            record.status === AttendanceStatus.PRESENT ? 'bg-green-900/30 text-green-400 border-green-800' : 
                                            record.status === AttendanceStatus.ABSENT ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-cyber-500">{record.checkInTime || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 shadow-2xl min-h-[600px] text-cyber-100">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-3 uppercase tracking-wider">
          <FileText className="w-6 h-6 text-cyber-500" /> Analytics Hub
        </h2>
        <div className="flex gap-3">
            <select 
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-sm text-white font-mono outline-none"
            >
                <option value="All">All Classes</option>
                {uniqueGrades.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-sm text-white font-mono outline-none"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="h-64 bg-cyber-900/40 rounded-xl border border-cyber-700 p-4">
            <h3 className="text-xs font-mono text-cyber-400 uppercase mb-4 text-center tracking-widest">Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={stats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {stats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="h-64 bg-cyber-900/40 rounded-xl border border-cyber-700 p-4">
             <h3 className="text-xs font-mono text-cyber-400 uppercase mb-4 text-center tracking-widest">Participation</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentDetails}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Bar dataKey="presentCount" stackId="a" fill={COLORS.present} radius={[0, 0, 2, 2]} />
                    <Bar dataKey="absentCount" stackId="a" fill={COLORS.absent} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-cyber-700 bg-cyber-900/30">
        <table className="w-full text-left text-sm">
            <thead className="bg-cyber-900 text-cyber-400 font-mono uppercase text-xs">
                <tr>
                    <th className="p-3">SN</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">GR No</th>
                    <th className="p-3">Class</th>
                    <th className="p-3 text-green-400">Present</th>
                    <th className="p-3 text-red-400">Absent</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3 text-right">View</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-cyber-800">
                {studentDetails.map((s, i) => (
                    <tr key={s.id} className="hover:bg-cyber-800/50 group">
                        <td className="p-3 font-mono text-cyber-600">{i + 1}</td>
                        <td className="p-3 font-bold text-white">{s.name}</td>
                        <td className="p-3 font-mono text-cyber-400">{s.grNo}</td>
                        <td className="p-3 font-mono text-cyber-400">{s.grade}</td>
                        <td className="p-3 text-green-500 font-mono">{s.presentCount}</td>
                        <td className="p-3 text-red-500 font-mono">{s.absentCount}</td>
                        <td className="p-3 text-white font-mono">{s.percentage}%</td>
                        <td className="p-3 text-right">
                            <button onClick={() => setViewingStudentId(s.id)} className="text-cyber-500 hover:text-cyber-300 p-1">
                                <History className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;