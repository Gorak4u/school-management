import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Wand2, Smartphone, Settings, Info, CheckCheck, XCircle, AlertTriangle, MessageCircle, Users } from 'lucide-react';
import { draftNotificationMessage } from '../services/geminiService';
import { SMSLog, WhatsAppGroup } from '../types';

interface CommunicationsProps {
  logs: SMSLog[];
  onSend: (log: SMSLog) => void;
  whatsAppGroups: WhatsAppGroup[];
}

const TEMPLATES = [
  { label: 'School Closed', text: 'Dear Parent, School will be closed tomorrow due to heavy rain. - Principal, SVS' },
  { label: 'Exam Schedule', text: 'Dear Parent, Annual exams start from next Monday. Please check diary for timetable. - SVS' },
  { label: 'Fee Reminder', text: 'Dear Parent, This is a gentle reminder to clear pending fees by end of this month. - SVS Office' },
  { label: 'Meeting', text: 'Dear Parent, A parent-teacher meeting is scheduled for Saturday at 10 AM. Please attend. - SVS' },
];

export const Communications: React.FC<CommunicationsProps> = ({ logs, onSend, whatsAppGroups }) => {
  const [type, setType] = useState<'Absence' | 'Homework' | 'Fee' | 'General'>('General');
  const [deliveryMethod, setDeliveryMethod] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [sendMode, setSendMode] = useState<'Individual' | 'Group'>('Individual');
  const [details, setDetails] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showGatewaySettings, setShowGatewaySettings] = useState(false);
  const [apiKey, setApiKey] = useState(''); // Fake state for visual

  const handleDraft = async () => {
    if (!details) return;
    setLoading(true);
    const text = await draftNotificationMessage(type as any, details);
    setDraft(text);
    setLoading(false);
  };

  const handleSend = () => {
    if (!draft) return;
    if (sendMode === 'Individual' && !recipient) return;
    if (sendMode === 'Group' && !selectedGroupId) return;

    let success = true;
    let status: 'Sent' | 'Failed' = 'Sent';
    let finalRecipient = recipient;

    if (deliveryMethod === 'WhatsApp') {
      if (sendMode === 'Individual') {
        const cleanPhone = recipient.replace(/\D/g, '');
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(draft)}`;
        window.open(url, '_blank');
      } else { // Group mode
        const group = whatsAppGroups.find(g => g.id === selectedGroupId);
        if (group) {
          finalRecipient = group.className;
          navigator.clipboard.writeText(draft).then(() => {
            alert(`Message copied to clipboard! Now opening WhatsApp group: ${group.className}`);
            window.open(group.groupLink, '_blank');
          }).catch(err => {
            alert('Could not copy message. Please copy it manually.');
            window.open(group.groupLink, '_blank');
          });
        } else {
          status = 'Failed';
        }
      }
    } else {
      // Simulation Logic for SMS
      success = Math.random() > 0.1; // 90% success rate
      status = success ? 'Sent' : 'Failed';
      alert(success ? 'SMS queued successfully.' : 'Simulation: Delivery failed.');
    }
    
    onSend({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      recipient: finalRecipient,
      message: draft,
      type,
      status,
      method: deliveryMethod
    });
    
    if (status === 'Sent') {
      setDraft('');
      setDetails('');
      setRecipient('');
      setSelectedGroupId('');
    }
  };

  const applyTemplate = (text: string) => {
    setDraft(text);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-fadeIn">
      {/* Left Panel: Compose */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             {deliveryMethod === 'WhatsApp' ? <MessageCircle className="text-green-600" size={20} /> : <MessageSquare className="text-indigo-600" size={20} />}
             Campaign Manager
           </h3>
           <div className="flex bg-white rounded-lg p-1 border border-slate-200">
             <button 
                onClick={() => setDeliveryMethod('WhatsApp')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${deliveryMethod === 'WhatsApp' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <MessageCircle size={14} /> WhatsApp
             </button>
             <button 
                onClick={() => setDeliveryMethod('SMS')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${deliveryMethod === 'SMS' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Smartphone size={14} /> SMS
             </button>
           </div>
           <button 
             onClick={() => setShowGatewaySettings(!showGatewaySettings)}
             className="text-slate-400 hover:text-indigo-600 transition-colors ml-4"
             title="Settings"
           >
             <Settings size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showGatewaySettings && deliveryMethod === 'SMS' && (
             <div className="bg-slate-900 text-slate-200 p-4 rounded-xl mb-4 text-xs">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle size={14}/> SMS Gateway Configuration (Demo)</h4>
                <p className="mb-3 opacity-80">This application is running in client-side mode. Real SMS requires a backend integration with providers like Twilio, Msg91, or TextLocal.</p>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">API Key</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white outline-none focus:border-indigo-500" />
                  <div className="flex justify-end">
                    <button onClick={() => setShowGatewaySettings(false)} className="text-indigo-400 hover:text-indigo-300 font-medium">Save Configuration</button>
                  </div>
                </div>
             </div>
          )}

          {/* Quick Templates */}
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Templates</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button 
                    key={t.label} 
                    onClick={() => applyTemplate(t.text)}
                    className={`p-3 text-left border rounded-lg transition-all group ${deliveryMethod === 'WhatsApp' ? 'hover:border-green-300 hover:bg-green-50' : 'hover:border-indigo-300 hover:bg-indigo-50'} border-slate-200`}
                  >
                     <div className={`font-semibold text-xs ${deliveryMethod === 'WhatsApp' ? 'text-green-800' : 'text-indigo-800'}`}>{t.label}</div>
                     <div className="text-[10px] text-slate-400 truncate mt-1">{t.text}</div>
                  </button>
                ))}
             </div>
          </div>
          
          <div className="space-y-4">
             {/* Send Mode Toggle */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Send To</label>
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 w-fit">
                    <button onClick={() => setSendMode('Individual')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${sendMode === 'Individual' ? 'bg-white shadow' : 'text-slate-500'}`}>
                        <Smartphone size={16}/> Individual
                    </button>
                    <button onClick={() => setSendMode('Group')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${sendMode === 'Group' ? 'bg-white shadow' : 'text-slate-500'}`}>
                        <Users size={16}/> Group
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {sendMode === 'Individual' ? 'Recipient Mobile' : 'Select Group'}
                  </label>
                  {sendMode === 'Individual' ? (
                     <input 
                        type="text" 
                        placeholder="e.g. 9900088888" 
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={recipient}
                        onChange={e => setRecipient(e.target.value)}
                    />
                  ) : (
                    <select 
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white"
                        value={selectedGroupId}
                        onChange={e => setSelectedGroupId(e.target.value)}
                    >
                        <option value="">-- Choose a group --</option>
                        {whatsAppGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.className}</option>
                        ))}
                    </select>
                  )}
               </div>
               <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white"
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                  >
                    <option value="General">General</option>
                    <option value="Absence">Absence</option>
                    <option value="Fee">Fees</option>
                    <option value="Homework">Homework</option>
                  </select>
               </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Content</label>
                <div className="relative">
                  <textarea 
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                    placeholder="Type your message here..."
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white px-1">
                    {draft.length} chars
                  </div>
                </div>
             </div>

             {/* AI Section */}
             <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
                <div className="flex gap-2 items-center mb-2">
                   <Wand2 size={16} className="text-purple-600" />
                   <span className="text-xs font-bold text-slate-700">AI Composer</span>
                </div>
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      placeholder="e.g. 'Polite fee reminder for class 10'"
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400"
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                   />
                   <button 
                      onClick={handleDraft}
                      disabled={loading || !details}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                   >
                      {loading ? <Loader2 size={16} className="animate-spin"/> : 'Draft'}
                   </button>
                </div>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button 
              onClick={handleSend}
              disabled={!draft || (sendMode === 'Individual' && !recipient) || (sendMode === 'Group' && !selectedGroupId)}
              className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none ${
                deliveryMethod === 'WhatsApp' 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
           >
              {deliveryMethod === 'WhatsApp' ? <MessageCircle size={18} /> : <Send size={18} />}
              {sendMode === 'Group' ? 'Send to Group' : (deliveryMethod === 'WhatsApp' ? 'Open in WhatsApp' : 'Send SMS')}
           </button>
        </div>
      </div>

      {/* Right Panel: Preview & Logs */}
      <div className="w-full lg:w-96 flex flex-col gap-6 h-full">
         {/* Phone Preview */}
         <div className="bg-white rounded-[2rem] shadow-xl border-8 border-slate-900 overflow-hidden relative h-64 shrink-0 bg-slate-100 flex flex-col">
            <div className="h-6 bg-slate-900 w-full absolute top-0 left-0 z-10 flex justify-center">
               <div className="w-20 h-4 bg-black rounded-b-xl"></div>
            </div>
            <div className={`p-2 flex items-center gap-2 pt-8 border-b border-slate-300 ${deliveryMethod === 'WhatsApp' ? 'bg-[#075E54] text-white' : 'bg-slate-200 text-slate-800'}`}>
               <div className="w-8 h-8 rounded-full bg-slate-400 border border-white/20"></div>
               <div className="flex-1">
                  <div className={`h-2 w-24 rounded mb-1 ${deliveryMethod === 'WhatsApp' ? 'bg-white/50' : 'bg-slate-400'}`}></div>
                  <div className={`h-1.5 w-12 rounded ${deliveryMethod === 'WhatsApp' ? 'bg-white/30' : 'bg-slate-300'}`}></div>
               </div>
            </div>
            <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-2 ${deliveryMethod === 'WhatsApp' ? 'bg-[#e5ddd5]' : 'bg-white'}`}>
               {draft ? (
                 <div className={`self-end p-2 rounded-lg rounded-tr-none shadow-sm max-w-[85%] text-xs text-slate-800 ${deliveryMethod === 'WhatsApp' ? 'bg-[#dcf8c6]' : 'bg-blue-100'}`}>
                    {draft}
                    <div className="text-[9px] text-slate-500 text-right mt-1">10:42 AM</div>
                 </div>
               ) : (
                 <div className="self-center bg-slate-400/20 text-slate-500 text-[10px] px-2 py-1 rounded-full mt-10">
                    Preview will appear here
                 </div>
               )}
            </div>
         </div>

         {/* Logs */}
         <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 font-bold text-slate-700 text-sm">Communication Log</div>
            <div className="flex-1 overflow-y-auto p-0">
               {logs.length > 0 ? logs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-800 text-xs">{log.recipient}</span>
                        {log.status === 'Sent' ? <CheckCheck size={14} className="text-blue-500"/> : <XCircle size={14} className="text-red-500"/>}
                     </div>
                     <p className="text-xs text-slate-500 truncate">{log.message}</p>
                     <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1">
                           <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                             log.type === 'Absence' ? 'bg-red-100 text-red-700' : 
                             log.type === 'Fee' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                           }`}>{log.type}</span>
                           {log.method === 'WhatsApp' && (
                             <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                               <MessageCircle size={8} /> WA
                             </span>
                           )}
                        </div>
                        <span className="text-[10px] text-slate-400">{log.date.split(' ')[0]}</span>
                     </div>
                  </div>
               )) : (
                  <div className="p-8 text-center text-slate-400 text-xs">No logs found.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};