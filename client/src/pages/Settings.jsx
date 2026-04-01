import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import useAuthStore from '../store/authStore';
import TwoFactorSetup from '../components/TwoFactorSetup';
import ModeToggle from '../components/ui/ModeToggle';
import api from '../services/api';

const AI_FEATURES = [
  { key: 'taskAssignment', label: 'Task Assignment', desc: 'AI suggests best employee for tasks' },
  { key: 'taskEscalation', label: 'Task Escalation', desc: 'AI analyzes context before escalating overdue tasks' },
  { key: 'leaveAnalysis', label: 'Leave Analysis', desc: 'AI analyzes risk when reviewing leave requests' },
  { key: 'dailyReports', label: 'Daily Reports', desc: 'AI generates smart reports with insights and recommendations' },
  { key: 'dashboardBriefing', label: 'Dashboard Briefing', desc: 'AI morning briefing with actionable items' },
  { key: 'meetingSummary', label: 'Meeting Intelligence', desc: 'AI pre-briefs, smart summaries, action item extraction' },
  { key: 'messageDrafting', label: 'Message Drafting', desc: 'AI drafts professional messages from rough notes' },
];

export default function Settings() {
  const { i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const [lang, setLang] = useState(i18n.language);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);
  const [aiPrefs, setAiPrefs] = useState({ masterMode: 'automation', features: {} });
  const [savingAI, setSavingAI] = useState(false);

  useEffect(() => {
    api.get('/users/ai-preferences').then(({ data }) => {
      if (data.aiPreferences) setAiPrefs(data.aiPreferences);
    }).catch(() => {});
  }, []);

  const saveAIPrefs = async (updated) => {
    setSavingAI(true);
    try {
      const { data } = await api.patch('/users/ai-preferences', updated);
      setAiPrefs(data.aiPreferences);
      toast.success('AI preferences saved');
    } catch {
      toast.error('Failed to save AI preferences');
    }
    setSavingAI(false);
  };

  const handleMasterToggle = (mode) => {
    const updated = { masterMode: mode };
    // When switching master to AI, enable all features. When switching to automation, disable all.
    if (mode === 'ai') {
      updated.features = {};
      AI_FEATURES.forEach((f) => { updated.features[f.key] = 'ai'; });
    } else {
      updated.features = {};
      AI_FEATURES.forEach((f) => { updated.features[f.key] = 'automation'; });
    }
    setAiPrefs((prev) => ({ ...prev, masterMode: mode, features: { ...prev.features, ...updated.features } }));
    saveAIPrefs(updated);
  };

  const handleFeatureToggle = (key, mode) => {
    setAiPrefs((prev) => ({ ...prev, features: { ...prev.features, [key]: mode } }));
    saveAIPrefs({ features: { [key]: mode } });
  };

  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const changeLang = (l) => { setLang(l); i18n.changeLanguage(l); localStorage.setItem('language', l); toast.success('Language changed'); };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} className="w-11 h-6 rounded-full relative transition-all"
      style={{ background: value ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.1)' }}>
      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md" style={{ left: value ? '22px' : '2px' }} />
    </button>
  );

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="max-w-2xl space-y-6">
          {/* Language */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4">Language</h3>
            <div className="flex gap-3">
              {[{ code: 'en', label: 'English', flag: '🇬🇧' }, { code: 'hi', label: 'Hindi', flag: '🇮🇳' }, { code: 'gu', label: 'Gujarati', flag: '🇮🇳' }].map((l) => (
                <button key={l.code} onClick={() => changeLang(l.code)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={lang === l.code
                    ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }
                    : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Email Notifications</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Receive task assignments and updates via email</p>
                </div>
                <Toggle value={emailNotifs} onChange={setEmailNotifs} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">In-App Notifications</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Show real-time notifications in the app</p>
                </div>
                <Toggle value={inAppNotifs} onChange={setInAppNotifs} />
              </div>
            </div>
          </div>

          {/* AI Intelligence Mode */}
          {isManager && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Intelligence Mode</h3>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Choose between rule-based automation or AI-powered decisions</p>
                </div>
                <ModeToggle mode={aiPrefs.masterMode || 'automation'} onChange={handleMasterToggle} />
              </div>

              <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>Per-Feature Control</p>
                {AI_FEATURES.map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-2">
                    <div className="flex-1 mr-4">
                      <p className="text-xs font-medium text-white/80">{f.label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{f.desc}</p>
                    </div>
                    <ModeToggle
                      size="small"
                      mode={aiPrefs.features?.[f.key] || 'automation'}
                      onChange={(mode) => handleFeatureToggle(f.key, mode)}
                    />
                  </div>
                ))}
              </div>

              {savingAI && <p className="text-[10px] text-purple-400 mt-3 animate-pulse">Saving...</p>}
            </div>
          )}

          {/* Security — 2FA */}
          <TwoFactorSetup enabled={twoFAEnabled} onUpdate={setTwoFAEnabled} />

          {/* Account */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4">Account</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</span>
                <span className="text-sm text-white/80">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Role</span>
                <span className="text-sm text-white/80 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <h3 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h3>
            <button onClick={logout}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
              style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
              Logout from all devices
            </button>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
