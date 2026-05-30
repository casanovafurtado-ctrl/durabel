'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquare, Calendar, CheckSquare, LogOut, Settings, Users, TrendingUp, FileText } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import CalendarPanel from '@/components/CalendarPanel';
import TasksPanel from '@/components/TasksPanel';
import SettingsPanel from '@/components/SettingsPanel';
import CRMPanel from '@/components/CRMPanel';
import FinancePanel from '@/components/FinancePanel';
import MinutesPanel from '@/components/MinutesPanel';
import Image from 'next/image';

const TABS = [
  { id: 'chat', label: 'DURABEL', icon: MessageSquare },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'crm', label: 'Clientes', icon: Users },
  { id: 'finance', label: 'Resultados', icon: TrendingUp },
  { id: 'minutes', label: 'Minutas', icon: FileText },
  { id: 'settings', label: 'Config', icon: Settings },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('chat');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="typing-dot w-3 h-3 rounded-full" style={{ background: 'var(--blue)' }} />
          ))}
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'Felipe';

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto relative" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <Image src={session.user.image} width={36} height={36} alt="avatar"
              className="rounded-full" style={{ border: '2px solid var(--blue)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #0055CC, #00BBFF)', color: 'white' }}>
              {firstName[0]}
            </div>
          )}
          <div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{getGreeting()},</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              {firstName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
            {time}
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatPanel />}
        {tab === 'calendar' && <CalendarPanel />}
        {tab === 'tasks' && <TasksPanel />}
        {tab === 'crm' && <CRMPanel />}
        {tab === 'finance' && <FinancePanel />}
        {tab === 'minutes' && <MinutesPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="flex flex-shrink-0" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-3 flex flex-col items-center gap-1 transition-all"
              style={{
                background: active ? 'rgba(0, 119, 255, 0.08)' : 'transparent',
                color: active ? 'var(--neon)' : 'var(--dim)',
                borderTop: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
              }}>
              <Icon size={20} />
              <span className="text-xs font-semibold" style={{ letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
