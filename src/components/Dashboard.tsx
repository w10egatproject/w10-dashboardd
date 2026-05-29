import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Search, 
  Edit, 
  Trash2, 
  LogOut, 
  LayoutDashboard,
  FileText,
  Bell,
  Calendar,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  TrendingUp,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings as SettingsIcon,
  Sun,
  Moon,
  User as UserIcon,
  Shield
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../Dashboard.css';

interface DashboardProps {
  user: string;
  onLogout: () => void;
}

interface Project {
  id: string;
  ecm: string;
  name: string;
  date: string;
  department: string;
  status: string;
  sheetSource?: string;
  equipGroup?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'dashboard' | 'reports' | 'status' | 'settings'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [weeklyData, setWeeklyData] = useState<{[key: string]: Project[]}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2023");
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayName, setDisplayName] = useState(user);

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = Array.from({ length: 10 }, (_, i) => (2020 + i).toString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
      const sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID;
      
      const fetchSheet = async (sheetName: string, range: string, mapper: (row: any, idx: number) => Project) => {
        try {
          const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${apiKey}`);
          const data = await response.json();
          return data.values ? data.values.map(mapper) : [];
        } catch (e) {
          console.error(`Error fetching ${sheetName}:`, e);
          return [];
        }
      };

      setLoading(true);
      
      const mainData = await fetchSheet('data', 'A2:J500', (row, idx) => ({
        id: row[0] || `d-${idx}`,
        ecm: row[2] || '-',
        name: row[4] || '-',
        date: row[6] || '-',
        department: row[8] || '-',
        status: 'รอดำเนินการ',
        sheetSource: 'data',
        equipGroup: row[8] || 'General' 
      }));

      const parseWeekly = (row: any, idx: number, source: string): Project => ({
        id: row[2] || `${source}-${idx}`,
        ecm: row[1] || '-',
        name: row[3] || '-',
        date: row[5] || '-',
        department: 'N/A', 
        status: row[8] || 'งานเข้า',
        sheetSource: source,
        equipGroup: row[4] || 'General' 
      });

      const w11 = await fetchSheet('W11', 'A2:I100', (r, i) => parseWeekly(r, i, 'W11'));
      const w12 = await fetchSheet('W12', 'A2:I100', (r, i) => parseWeekly(r, i, 'W12'));
      const w13 = await fetchSheet('W13', 'A2:I100', (r, i) => parseWeekly(r, i, 'W13'));
      const w14 = await fetchSheet('W14', 'A2:I100', (r, i) => parseWeekly(r, i, 'W14'));

      setProjects(mainData);
      setWeeklyData({ W11: w11, W12: w12, W13: w13, W14: w14 });
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (p.date === '-') return false;
      const dateParts = p.date.split('/');
      if (dateParts.length < 3) return false;
      const itemMonth = (parseInt(dateParts[1]) - 1).toString();
      const itemYear = dateParts[2].trim();
      const monthMatch = selectedMonth === "all" || itemMonth === selectedMonth;
      const yearMatch = itemYear === selectedYear;
      
      const searchMatch = searchTerm === '' || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ecm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase());

      return monthMatch && yearMatch && searchMatch;
    });
  }, [projects, selectedMonth, selectedYear, searchTerm]);

  const workflowStats = useMemo(() => {
    const calculateInOut = (list: Project[]) => {
      const outCount = list.filter(p => 
        p.status.includes('เสร็จ') || 
        p.status.includes('สำเร็จ') ||
        p.status.includes('ปิดงาน')
      ).length;
      const inCount = list.length - outCount;
      return { in: inCount, out: outCount, total: list.length };
    };
    const allProjects = [...projects, ...Object.values(weeklyData).flat()];
    return {
      W11: calculateInOut(weeklyData.W11 || []),
      W12: calculateInOut(weeklyData.W12 || []),
      W13: calculateInOut(weeklyData.W13 || []),
      W14: calculateInOut(weeklyData.W14 || []),
      Total: calculateInOut(allProjects)
    };
  }, [weeklyData, projects]);

  const deptWeeklySummary = useMemo(() => {
    const groups = ["BEML", "Conveyor", "สูบน้ำ", "Moblie other", "power plant", "General"];
    const summary: { [key: string]: { [key: string]: number } } = {};
    
    groups.forEach(g => {
      summary[g] = { W11: 0, W12: 0, W13: 0, W14: 0, Total: 0 };
    });
    
    Object.entries(weeklyData).forEach(([week, projects]) => {
      projects.forEach(p => {
        if (p.status.includes('งานเข้า')) {
          const group = groups.find(g => p.equipGroup?.includes(g)) || "General";
          if (summary[group]) {
            summary[group][week] += 1;
            summary[group].Total += 1;
          }
        }
      });
    });
    
    return summary;
  }, [weeklyData]);

  const weeklyStats = useMemo(() => {
    return Object.keys(weeklyData).map(key => ({
      name: key,
      count: weeklyData[key].length,
      completed: weeklyData[key].filter(p => p.status === 'เสร็จ' || p.status === 'เสร็จสิ้น').length,
      pending: weeklyData[key].filter(p => p.status !== 'เสร็จ' && p.status !== 'เสร็จสิ้น').length,
    }));
  }, [weeklyData]);

  const deptChartData = useMemo(() => {
    const deptMap: { [key: string]: number } = {};
    filteredProjects.forEach(p => {
      const dept = p.department || 'ไม่ระบุ';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    return Object.keys(deptMap).map(name => ({
      name,
      value: deptMap[name]
    })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredProjects]);

  const statusStats = useMemo(() => {
    const total = projects.length;
    if (total === 0) return { finish: 0, pending: 0, finishPercent: 0, pendingPercent: 0 };
    const finish = projects.filter(p => p.status.includes('เสร็จ') || p.status.includes('สำเร็จ')).length;
    const pending = projects.filter(p => p.status.includes('รอ') || p.status.includes('SAP')).length;
    return {
      finish,
      pending,
      finishPercent: ((finish / total) * 100).toFixed(1),
      pendingPercent: ((pending / total) * 100).toFixed(1)
    };
  }, [projects]);

  const COLORS = ['#1e3a8a', '#fbbf24', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899'];

  const renderStatus = (status: string) => {
    let type = 'pending';
    if (status.includes('เสร็จ') || status.includes('สำเร็จ')) type = 'success';
    else if (status.includes('ดำเนินการ') || status.includes('งานเข้า')) type = 'processing';
    else if (status.includes('รอ')) type = 'waiting';

    return (
      <div className={`compact-status ${type}`}>
        <div className="status-dot-inner"></div>
        <span>{status}</span>
      </div>
    );
  };

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>
      <nav className="top-nav">
        <div className="nav-left">
          <div className="logo"><img src="/LogoEGATE.jpg" alt="Logo" className="logo-img" /></div>
          <div className="nav-links">
            <a className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('dashboard'); }}>หน้าแรก</a>
            <a className={`nav-link ${view === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('reports'); }}>รายงาน</a>
            <a className={`nav-link ${view === 'status' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('status'); }}>สถานะการดำเนินงาน</a>
            <a className={`nav-link ${view === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('settings'); }}>ตั้งค่า</a>
          </div>
        </div>
        <div className="nav-right">
          <button className="dev-credit-btn"><span className="dev-dot"></span>dev.warit</button>
          <button onClick={onLogout} className="logout-btn"><LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />ออกจากระบบ</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="content-header">
          <div className="header-left">
            <h2>
              {view === 'dashboard' ? 'แผงควบคุมหลัก' : 
               view === 'reports' ? 'รายงานวิเคราะห์รายสัปดาห์ (W11-W14)' : 
               view === 'status' ? 'สถานะการดำเนินงานภาพรวม' : 'ตั้งค่าระบบ'}
            </h2>
            <p className="header-subtitle">ข้อมูลสรุปจาก Google Sheet</p>
          </div>
          
          <div className="header-right">
            <div className="filter-container">
              <div className="filter-label"><Calendar size={16} /><span>ตัวกรอง:</span></div>
              <div className="filter-group">
                <select className="filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="all">ทุกเดือน</option>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <div className="filter-divider"></div>
                <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
                </select>
              </div>
            </div>

            <div className="clock-wrapper">
              <div className="clock-icon"><Clock size={18} /></div>
              <div className="clock-content">
                <div className="clock-date">{currentTime.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}</div>
                <div className="clock-time">{currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.</div>
              </div>
            </div>
          </div>
        </header>

        {view === 'dashboard' ? (
          <>
            <div className="stats-grid">
              <div className="stats-card blue"><div className="stats-icon blue"><Users size={24} /></div><div className="stats-info"><h3>รายการที่พบ</h3><div className="value">{filteredProjects.length} รายการ</div></div></div>
              <div className="stats-card yellow"><div className="stats-icon yellow"><BookOpen size={24} /></div><div className="stats-info"><h3>แผนกที่เกี่ยวข้อง</h3><div className="value">{new Set(filteredProjects.map(p => p.department)).size} แผนก</div></div></div>
              <div className="stats-card blue"><div className="stats-icon blue"><CheckCircle size={24} /></div><div className="stats-info"><h3>ECM ที่เปิดแล้ว</h3><div className="value">{filteredProjects.filter(p => p.ecm !== '-').length} รายการ</div></div></div>
              <div className="stats-card yellow"><div className="stats-icon yellow"><FileText size={24} /></div><div className="stats-info"><h3>ข้อมูลทั้งหมดในระบบ</h3><div className="value">{projects.length}</div></div></div>
            </div>
            <div className="table-section">
              <div className="table-header">
                <h3>รายการข้อมูล {selectedMonth === "all" ? "ทุกเดือน" : `ประจำเดือน ${months[parseInt(selectedMonth)]}`} {parseInt(selectedYear) + 543}</h3>
                <div className="search-bar"><Search className="search-icon" size={18} /><input type="text" placeholder="ค้นหาข้อมูล..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              </div>
              <table className="data-table">
                <thead><tr><th>ID</th><th>ECM</th><th>รายละเอียด</th><th>วันที่</th><th>แผนก</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p, idx) => (
                      <tr key={idx}><td>{p.id}</td><td style={{ fontWeight: 500, color: '#1e3a8a' }}>{p.ecm}</td><td>{p.name}</td><td>{p.date}</td><td>{p.department}</td><td>{renderStatus(p.status)}</td><td><div className="action-btns"><button className="action-btn edit-btn"><Edit size={18} /></button><button className="action-btn delete-btn"><Trash2 size={18} /></button></div></td></tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>ไม่พบข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : view === 'reports' ? (
          <div className="reports-section">
            <div className="chart-card full-width">
              <div className="chart-header"><TableIcon size={20} /><h3>สรุปงานเข้าตามกลุ่มงาน (Equipment Group)</h3></div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>กลุ่มงาน (Eq)</th>
                    <th>W11</th>
                    <th>W12</th>
                    <th>W13</th>
                    <th>W14</th>
                    <th>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(deptWeeklySummary).map(([group, counts]) => (
                    <tr key={group}>
                      <td style={{fontWeight: 700}}>{group}</td>
                      <td>{counts.W11}</td>
                      <td>{counts.W12}</td>
                      <td>{counts.W13}</td>
                      <td>{counts.W14}</td>
                      <td style={{fontWeight: 700, color: 'var(--egat-blue)'}}>{counts.Total}</td>
                    </tr>
                  ))}
                  <tr style={{backgroundColor: '#f8fafc', fontWeight: 800}}>
                    <td>รวมทั้งหมด</td>
                    <td>{Object.values(deptWeeklySummary).reduce((a, b) => a + b.W11, 0)}</td>
                    <td>{Object.values(deptWeeklySummary).reduce((a, b) => a + b.W12, 0)}</td>
                    <td>{Object.values(deptWeeklySummary).reduce((a, b) => a + b.W13, 0)}</td>
                    <td>{Object.values(deptWeeklySummary).reduce((a, b) => a + b.W14, 0)}</td>
                    <td style={{color: 'var(--egat-blue)'}}>{Object.values(deptWeeklySummary).reduce((a, b) => a + b.Total, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="charts-grid-vertical" style={{marginTop: '20px'}}>
              <div className="chart-card full-width">
                <div className="chart-header"><TrendingUp size={20} /><h3>เปรียบเทียบจำนวนรายการรายสัปดาห์</h3></div>
                <ResponsiveContainer width="100%" height={350}><BarChart data={weeklyStats}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={14} fontWeight={700} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar name="รายการทั้งหมด" dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={50} /><Bar name="เสร็จสิ้นแล้ว" dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} /></BarChart></ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : view === 'status' ? (
          <div className="status-container">
            <div className="stats-grid">
              <div className="stats-card success"><div className="stats-icon success"><CheckCircle size={24} /></div><div className="stats-info"><h3>Finish W/O</h3><div className="value" style={{color: '#10b981'}}>{statusStats.finishPercent}%</div><p>{statusStats.finish} รายการ</p></div></div>
              <div className="stats-card pending"><div className="stats-icon pending"><Activity size={24} /></div><div className="stats-info"><h3>SAP Pending</h3><div className="value" style={{color: '#f59e0b'}}>{statusStats.pendingPercent}%</div><p>{statusStats.pending} รายการ</p></div></div>
            </div>
            <div className="chart-card" style={{marginTop: '20px'}}>
              <h3>ภาพรวมสถานะการดำเนินงาน</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={[{name: 'Finish', value: statusStats.finish}, {name: 'SAP Pending', value: statusStats.pending}]} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                    <Cell fill="#10b981" /><Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="settings-section">
            <div className="settings-card">
              <h3><SettingsIcon size={20} /> ตั้งค่าส่วนตัว</h3>
              <div className="settings-item">
                <label>โหมดกลางคืน (Dark Mode)</label>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="toggle-btn">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{isDarkMode ? 'เปิดโหมดปกติ' : 'เปิดโหมดกลางคืน'}</span>
                </button>
              </div>
              <div className="settings-item">
                <label>ชื่อที่แสดง (Display Name)</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="settings-input" />
              </div>
              <div className="settings-item">
                <label>ความปลอดภัย</label>
                <button className="security-btn"><Shield size={20} /> เปลี่ยนรหัสผ่าน</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
