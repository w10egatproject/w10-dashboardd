import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Search, 
  Edit, 
  Trash2, 
  LogOut, 
  FileText,
  Calendar,
  Clock,
  Table as TableIcon,
  TrendingUp,
  Activity,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Shield,
  ChevronLeft,
  ChevronRight,
  PieChart as PieChartIcon
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
  const [view, setView] = useState<'overview' | 'dashboard' | 'reports' | 'status' | 'loadFactor' | 'settings'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [debugInfo, setDebugInfo] = useState<{main: number, w11: number, w12: number, w13: number, w14: number}>({main: 0, w11: 0, w12: 0, w13: 0, w14: 0});
  const [weeklyData, setWeeklyData] = useState<{[key: string]: Project[]}>({});
  const [dashboardW10All, setDashboardW10All] = useState<any[]>([]);
  const [dashboardW10AllInfo, setDashboardW10AllInfo] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [displayName, setDisplayName] = useState(user);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
      const sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID;
      
      const fetchSheet = async (sheetName: string, range: string, mapper: (row: any, idx: number) => any) => {
        try {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!${range}?key=${apiKey}`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.error) {
            console.error(`API Error for ${sheetName}:`, data.error.message);
            return [];
          }
          
          if (!data.values) {
            console.warn(`No data found in ${sheetName} range ${range}`);
            return [];
          }

          console.log(`Successfully fetched ${data.values.length} rows from ${sheetName}`);
          return data.values.map(mapper);
        } catch (e) {
          console.error(`Network Error fetching ${sheetName}:`, e);
          return [];
        }
      };

      const parseWeekly = (row: any, idx: number, source: string): Project => {
        if (source === 'W11') {
          // Mapping for 'Dashboard W10 All info' starting at Column W
          // Index: 0=W, 1=X, 2=Y, 3=Z, 4=AA, 5=AB, 6=AC, 7=AD, 8=AE, 9=AF
          const mainStatus = row[0] || '';
          const subStatus = row[9] || '';
          return {
            id: row[3] || row[1] || `${source}-${idx}`,
            ecm: row[2] || '-',
            name: row[4] || row[1] || '-',
            date: row[6] || '-',
            department: 'N/A', 
            status: `${mainStatus} ${subStatus}`.trim() || 'รอดำเนินการ',
            sheetSource: source,
            equipGroup: row[5] || 'General' 
          };
        }
        // Default mapping for other weeks (A-I)
        return {
          id: row[2] || row[0] || `${source}-${idx}`,
          ecm: row[1] || '-',
          name: row[3] || row[0] || '-',
          date: row[5] || '-',
          department: 'N/A', 
          status: row[8] || 'รอดำเนินการ',
          sheetSource: source,
          equipGroup: row[4] || 'General' 
        };
      };

      const w11 = await fetchSheet('Dashboard W10 All info', 'W2:AF500', (r, i) => parseWeekly(r, i, 'W11'));
      const w12 = await fetchSheet('W12', 'A2:I100', (r, i) => parseWeekly(r, i, 'W12'));
      const w13 = await fetchSheet('W13', 'A2:I100', (r, i) => parseWeekly(r, i, 'W13'));
      const w14 = await fetchSheet('W14', 'A2:I100', (r, i) => parseWeekly(r, i, 'W14'));

      // Also try lowercase if uppercase fails
      let finalW11 = w11;
      if (w11.length === 0) {
        finalW11 = await fetchSheet('Dashboard w10 all info', 'W2:AF500', (r, i) => parseWeekly(r, i, 'W11'));
      }

      setDebugInfo({
        main: mainData.length,
        w11: finalW11.length,
        w12: w12.length,
        w13: w13.length,
        w14: w14.length
      });

      // Combine all data for Global projects state
      const allProjects = [...mainData, ...finalW11, ...w12, ...w13, ...w14].filter(p => p.name !== '-' || p.ecm !== '-');
      
      setProjects(allProjects);
      setWeeklyData({ W11: finalW11, W12: w12, W13: w13, W14: w14 });
      
      setDashboardW10All(await fetchSheet('Dashboard w10 all', 'A2:Z200', r => r));
      setDashboardW10AllInfo(await fetchSheet('Dashboard W10 All info', 'A2:Z200', r => r));
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
      const yearMatch = selectedYear === "all" || itemYear === selectedYear;
      
      const searchMatch = searchTerm === '' || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ecm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase());

      return monthMatch && yearMatch && searchMatch;
    });
  }, [projects, selectedMonth, selectedYear, searchTerm]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

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
    return Object.keys(weeklyData).map(key => {
      const data = weeklyData[key];
      return {
        name: key,
        total: data.length,
        in: data.filter(p => p.status.includes('งานเข้า') || p.status.includes('เข้า')).length,
        pending: data.filter(p => p.status.includes('รอ') || p.status.includes('ดำเนินการ') || p.status.includes('ยังไม่เสร็จ')).length,
        completed: data.filter(p => p.status.includes('เสร็จ') || p.status.includes('สำเร็จ')).length,
        out: data.filter(p => p.status.includes('ออก')).length,
        other: data.filter(p => !p.status.includes('เข้า') && !p.status.includes('เสร็จ') && !p.status.includes('สำเร็จ') && !p.status.includes('ออก') && !p.status.includes('รอ') && !p.status.includes('ดำเนินการ')).length,
      };
    });
  }, [weeklyData]);

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
            <a className={`nav-link ${view === 'overview' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('overview'); }}>ภาพรวม</a>
            <a className={`nav-link ${view === 'loadFactor' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('loadFactor'); }}>Load Factor / Man</a>
            <a className={`nav-link ${view === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('settings'); }}>ตั้งค่า</a>
          </div>
        </div>
        <div className="nav-right">
          <button className="dev-credit-btn"><span className="dev-dot"></span>{displayName}</button>
          <button onClick={onLogout} className="logout-btn"><LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />ออกจากระบบ</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="content-header">
          <div className="header-left">
            <h2>
              {view === 'overview' ? 'ภาพรวมระบบ (System Overview)' : 
               view === 'dashboard' ? 'แผงควบคุมหลัก' : 
               view === 'reports' ? 'รายงานวิเคราะห์รายสัปดาห์ (W11-W14)' : 
               view === 'status' ? 'สถานะการดำเนินงานภาพรวม' : 
               view === 'loadFactor' ? 'Load Factor / Man Power' : 'ตั้งค่าระบบ'}
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
                  <option value="all">ทุกปี</option>
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

        {view === 'overview' ? (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stats-card blue">
                <div className="stats-icon blue"><Activity size={24} /></div>
                <div className="stats-info">
                  <h3>โครงการทั้งหมด</h3>
                  <div className="value">{projects.length}</div>
                  <p>รายการในฐานข้อมูล</p>
                </div>
              </div>
              <div className="stats-card success">
                <div className="stats-icon success"><CheckCircle size={24} /></div>
                <div className="stats-info">
                  <h3>ดำเนินการเสร็จสิ้น</h3>
                  <div className="value" style={{color: '#10b981'}}>{statusStats.finish}</div>
                  <p>{statusStats.finishPercent}% ของทั้งหมด</p>
                </div>
              </div>
              <div className="stats-card yellow">
                <div className="stats-icon yellow"><Clock size={24} /></div>
                <div className="stats-info">
                  <h3>รอดำเนินการ / SAP</h3>
                  <div className="value" style={{color: '#f59e0b'}}>{statusStats.pending}</div>
                  <p>{statusStats.pendingPercent}% ของทั้งหมด</p>
                </div>
              </div>
              <div className="stats-card blue">
                <div className="stats-icon blue"><TrendingUp size={24} /></div>
                <div className="stats-info">
                  <h3>ประสิทธิภาพเฉลี่ย</h3>
                  <div className="value">85.4%</div>
                  <p>ค่าเฉลี่ยรายเดือน</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div className="chart-card">
                <div className="chart-header">
                  <TrendingUp size={20} />
                  <h3>แนวโน้มงานรายสัปดาห์ (W11 - W14)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="งานเข้า" dataKey="in" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    <Bar name="งานออก" dataKey="out" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <PieChartIcon size={20} />
                  <h3>สัดส่วนสถานะงานปัจจุบัน</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'เสร็จสิ้น', value: statusStats.finish },
                        { name: 'รอดำเนินการ', value: statusStats.pending }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card full-width" style={{ marginTop: '20px' }}>
              <div className="chart-header">
                <TableIcon size={20} />
                <h3>ตารางสรุปกลุ่มงานหลัก</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>กลุ่มงาน</th>
                    <th>จำนวนงาน (W11-W14)</th>
                    <th>สถานะเฉลี่ย</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(deptWeeklySummary).slice(0, 4).map(([group, counts]) => (
                    <tr key={group}>
                      <td><strong>{group}</strong></td>
                      <td>{counts.Total} รายการ</td>
                      <td>{renderStatus(counts.Total > 5 ? 'ดำเนินการแล้ว' : 'รอดำเนินการ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'dashboard' ? (
          <>
            <div className="stats-grid">
              {weeklyStats.map((stat, i) => (
                <div key={i} className={`stats-card ${i % 2 === 0 ? 'blue' : 'yellow'}`} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div className="stats-icon circular">
                      <img src="/LogoEGATE.jpg" alt="EGAT" className="stat-user-img" />
                    </div>
                    <div className="stats-info">
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{stat.name} เข้า {stat.total}</h3>
                    </div>
                  </div>
                  
                  <div className="weekly-breakdown-list">
                    <div className="breakdown-item">
                      <span className="breakdown-label">ยังไม่เสร็จ</span>
                      <span className="breakdown-value" style={{fontSize: '16px'}}>{stat.pending}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">เสร็จ</span>
                      <span className="breakdown-value highlight" style={{fontSize: '16px'}}>{stat.completed}</span>
                    </div>
                    <div className="breakdown-item" style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}>
                      <span className="breakdown-label">อื่น</span>
                      <span className="breakdown-value" style={{fontSize: '16px'}}>{stat.other}</span>
                    </div>
                    <div className="breakdown-item" style={{ marginTop: '8px', paddingTop: '4px' }}>
                      <span className="breakdown-label" style={{ fontWeight: 800, fontSize: '16px' }}>งานออก</span>
                      <span className="breakdown-value" style={{ fontSize: '16px', color: 'var(--egat-blue)' }}>{stat.out}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="stats-grid" style={{ marginTop: '20px' }}>
              <div 
                className="stats-card blue clickable" 
                onClick={() => { setSearchTerm(''); setSelectedMonth('all'); setSelectedYear('all'); }}
                title="คลิกเพื่อล้างตัวกรองทั้งหมด"
              >
                <div className="stats-icon blue"><Users size={24} /></div>
                <div className="stats-info">
                  <h3>รายการที่พบ</h3>
                  <div className="value">{filteredProjects.length} รายการ</div>
                </div>
              </div>

              <div className="stats-card yellow">
                <div className="stats-icon yellow"><BookOpen size={24} /></div>
                <div className="stats-info">
                  <h3>แผนกที่เกี่ยวข้อง</h3>
                  <div className="value">{new Set(filteredProjects.map(p => p.department)).size} แผนก</div>
                </div>
              </div>

              <div 
                className="stats-card blue clickable"
                onClick={() => setSearchTerm('')}
                title="ล้างคำค้นหา"
              >
                <div className="stats-icon blue"><CheckCircle size={24} /></div>
                <div className="stats-info">
                  <h3>ECM ที่เปิดแล้ว</h3>
                  <div className="value">{filteredProjects.filter(p => p.ecm !== '-').length} รายการ</div>
                </div>
              </div>

              <div 
                className="stats-card yellow clickable"
                onClick={() => { setSearchTerm(''); setSelectedMonth('all'); setSelectedYear('all'); }}
                title="ดูข้อมูลทั้งหมด"
              >
                <div className="stats-icon yellow"><FileText size={24} /></div>
                <div className="stats-info">
                  <h3>ข้อมูลทั้งหมดในระบบ</h3>
                  <div className="value">{projects.length}</div>
                </div>
              </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '20px', marginBottom: '20px' }}>
              <div className="stats-card full-width">
                <div className="stats-icon"><Activity size={28} /></div>
                <div className="stats-info">
                  <h3>รวม w/o ทั้งหมด</h3>
                  <div className="value">{projects.length} รายการ</div>
                </div>
              </div>
            </div>

            <div className="table-section">
              <div className="table-header">
                <h3>รายการข้อมูล {selectedMonth === "all" ? "ทุกเดือน" : `ประจำเดือน ${months[parseInt(selectedMonth)]}`} {selectedYear === "all" ? "ทุกปี" : parseInt(selectedYear) + 543}</h3>
                <div className="search-bar"><Search className="search-icon" size={18} /><input type="text" placeholder="ค้นหาข้อมูล..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              </div>
              <table className="data-table">
                <thead><tr><th>ID</th><th>ECM</th><th>รายละเอียด</th><th>วันที่</th><th>แผนก</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {paginatedProjects.length > 0 ? (
                    paginatedProjects.map((p, idx) => (
                      <tr key={idx}><td>{p.id}</td><td style={{ fontWeight: 500, color: '#1e3a8a' }}>{p.ecm}</td><td>{p.name}</td><td>{p.date}</td><td>{p.department}</td><td>{renderStatus(p.status)}</td><td><div className="action-btns"><button className="action-btn edit-btn"><Edit size={18} /></button><button className="action-btn delete-btn"><Trash2 size={18} /></button></div></td></tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>ไม่พบข้อมูล</td></tr>
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} /> ก่อนหน้า
                  </button>
                  <div className="page-info">
                    หน้า {currentPage} จาก {totalPages}
                  </div>
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป <ChevronRight size={18} />
                  </button>
                </div>
              )}
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
        ) : view === 'loadFactor' ? (
          <div className="load-factor-section">
            <div className="stats-grid">
              <div className="stats-card blue">
                <div className="stats-icon blue"><Users size={24} /></div>
                <div className="stats-info">
                  <h3>Total Man Power</h3>
                  <div className="value">-- คน</div>
                </div>
              </div>
              <div className="stats-card yellow">
                <div className="stats-icon yellow"><TrendingUp size={24} /></div>
                <div className="stats-info">
                  <h3>Avg Load Factor</h3>
                  <div className="value">-- %</div>
                </div>
              </div>
            </div>
            
            <div className="chart-card" style={{marginTop: '20px'}}>
              <div className="chart-header"><Activity size={20} /><h3>ประสิทธิภาพการทำงาน (Load Factor)</h3></div>
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--egat-gray)' }}>
                <p>กำลังพัฒนาส่วนแสดงผลข้อมูลจากชีต Dashboard L/F</p>
                <small>รอดำเนินการเชื่อมต่อข้อมูล Man Power และ Load Factor</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="settings-section">
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}><SettingsIcon size={20} /> ตั้งค่าระบบ</h3>
                {saveStatus === 'success' && <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 800 }}>บันทึกสำเร็จ!</span>}
              </div>

              <div className="settings-item">
                <div className="settings-info-text">
                  <label>โหมดกลางคืน (Dark Mode)</label>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--egat-gray)' }}>ปรับเปลี่ยนโทนสีของหน้าจอตามความต้องการ</p>
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`toggle-btn ${isDarkMode ? 'active' : ''}`}>
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{isDarkMode ? 'เปิดโหมดปกติ' : 'เปิดโหมดกลางคืน'}</span>
                </button>
              </div>

              <div className="settings-item">
                <div className="settings-info-text">
                  <label>ชื่อที่แสดง (Display Name)</label>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--egat-gray)' }}>ชื่อที่จะปรากฏบนหน้า Dashboard และรายงาน</p>
                </div>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  className="settings-input"
                  placeholder="ใส่ชื่อของคุณ..."
                />
              </div>

              <div className="settings-item">
                <div className="settings-info-text">
                  <label>ความปลอดภัย</label>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--egat-gray)' }}>จัดการรหัสผ่านและสิทธิ์การเข้าถึง</p>
                </div>
                <button className="security-btn"><Shield size={18} /> เปลี่ยนรหัสผ่าน</button>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button 
                  className="save-settings-btn" 
                  onClick={handleSaveSettings}
                  disabled={saveStatus !== 'idle'}
                >
                  {saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '20px', backgroundColor: '#eff6ff' }}>
              <h3 style={{ fontSize: '16px', color: '#1e3a8a' }}><Users size={18} /> ข้อมูลการติดต่อ</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#1e3a8a' }}>
                <p><strong>ที่อยู่:</strong> 801 หมู่ 6 ต.แม่เมาะ อ.แม่เมาะ จ.ลำปาง 52220</p>
                <p><strong>ติดต่อสอบถามข้อมูล:</strong> ประชาสัมพันธ์เหมืองแม่เมาะ โทร. 0-5425-4051-4</p>
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '20px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '14px' }}><Activity size={18} /> ข้อมูลโปรเจกต์</h3>
              <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b' }}>
                <p><strong>เวอร์ชัน:</strong> 1.2.0 (Stable)</p>
                <p><strong>ผู้พัฒนา:</strong> dev.warit</p>
                <p><strong>แหล่งข้อมูล:</strong> Google Sheets API v4</p>
                <p><strong>สถานะระบบ:</strong> เชื่อมต่อปกติ</p>
              </div>
            </div>
          </div>
        )}

        <footer className="main-footer">
          <div className="footer-content">
            <img src="/LogoEGATE.jpg" alt="EGAT Logo" className="footer-logo" />
            <div className="footer-info">
              <p><strong>การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (เหมืองแม่เมาะ)</strong></p>
              <p>801 หมู่ 6 ต.แม่เมาะ อ.แม่เมาะ จ.ลำปาง 52220</p>
              <p>ติดต่อสอบถามข้อมูล: ประชาสัมพันธ์เหมืองแม่เมาะ โทร. 0-5425-4051-4</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2024 Electricity Generating Authority of Thailand (EGAT)</span>
            <div className="footer-dot"></div>
            <span>Powered by dev.warit</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
