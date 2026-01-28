import React, { useState, useEffect, useRef } from 'react';

const CONFIG = {
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

const createSupabaseClient = (url, key) => {
  if (!url || !key) return null;
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  return {
    from: (table) => {
      let queryParams = [], method = 'GET', body = null;
      const builder = {
        select(columns = '*') { queryParams.push(`select=${columns}`); return builder; },
        eq(column, value) { queryParams.push(`${column}=eq.${value}`); return builder; },
        order(column, { ascending = true } = {}) { queryParams.push(`order=${column}.${ascending ? 'asc' : 'desc'}`); return builder; },
        insert(data) { method = 'POST'; body = JSON.stringify(Array.isArray(data) ? data : [data]); return builder; },
        update(data) { method = 'PATCH'; body = JSON.stringify(data); return builder; },
        delete() { method = 'DELETE'; return builder; },
        async then(resolve) {
          try {
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const res = await fetch(`${url}/rest/v1/${table}${queryString}`, { method, headers, body });
            const data = await res.json();
            resolve({ data: res.ok ? data : null, error: res.ok ? null : new Error(data.message) });
          } catch (error) { resolve({ data: null, error }); }
        }
      };
      return builder;
    }
  };
};

const supabase = createSupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const processVoiceWithAI = async (transcript, contactName) => {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: transcript, contactName })
    });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'API request failed'); }
    return await response.json();
  } catch (error) {
    console.error('AI processing error:', error);
    return { summary: transcript, keyFacts: [], reminders: [], suggestedFollowUp: null, error: error.message };
  }
};

const STORAGE_KEY = 'contacts-app-data';
const loadFromLocalStorage = () => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; } catch { return null; } };
const saveToLocalStorage = (contacts) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts)); } catch {} };

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function ContactsApp() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showKnownThroughPicker, setShowKnownThroughPicker] = useState(false);
  const [knownThroughSearch, setKnownThroughSearch] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState({ note: '', date: '', time: '', type: 'notification' });
  const [tempNotes, setTempNotes] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [useSupabase] = useState(!!supabase);

  const recognitionRef = useRef(null);
  const sectionRefs = useRef({});
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (supabase) {
        try {
          const { data, error } = await supabase.from('contacts').select('*').order('first_name', { ascending: true });
          if (!error && data?.length > 0) {
            const { data: reminders } = await supabase.from('reminders').select('*').eq('is_completed', false);
            setContacts(data.map(c => ({
              id: c.id, firstName: c.first_name, lastName: c.last_name || '', jobTitle: c.job_title || '',
              company: c.company || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '',
              knownThrough: c.known_through, photo: c.photo_url,
              reminders: (reminders || []).filter(r => r.contact_id === c.id).map(r => ({
                id: r.id, note: r.note, date: r.reminder_date, time: r.reminder_time, type: r.reminder_type
              }))
            })));
            setLoading(false);
            return;
          }
        } catch {}
      }
      setContacts(loadFromLocalStorage() || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => { if (!loading) saveToLocalStorage(contacts); }, [contacts, loading]);

  const saveContact = async () => {
    let saved;
    if (view === 'new') {
      saved = { ...editForm, id: editForm.id || Date.now().toString(), reminders: [] };
      setContacts(prev => [...prev, saved]);
      if (useSupabase) {
        await supabase.from('contacts').insert({
          id: saved.id, first_name: saved.firstName, last_name: saved.lastName,
          job_title: saved.jobTitle, company: saved.company, phone: saved.phone,
          email: saved.email, notes: saved.notes, known_through: saved.knownThrough, photo_url: saved.photo
        });
      }
    } else {
      saved = { ...editForm };
      setContacts(prev => prev.map(c => c.id === editForm.id ? saved : c));
      if (useSupabase) {
        await supabase.from('contacts').update({
          first_name: saved.firstName, last_name: saved.lastName, job_title: saved.jobTitle,
          company: saved.company, phone: saved.phone, email: saved.email, notes: saved.notes,
          known_through: saved.knownThrough, photo_url: saved.photo
        }).eq('id', saved.id);
      }
    }
    setSelectedContact(saved);
    setView('detail');
    setTempNotes(saved.notes || '');
  };

  const updateContact = async (updates) => {
    const updated = { ...selectedContact, ...updates };
    setContacts(prev => prev.map(c => c.id === selectedContact.id ? updated : c));
    setSelectedContact(updated);
    if (useSupabase && updates.notes !== undefined) {
      await supabase.from('contacts').update({ notes: updates.notes }).eq('id', selectedContact.id);
    }
  };

  const deleteContact = async () => {
    if (window.confirm(`Delete ${selectedContact.firstName} ${selectedContact.lastName}?`)) {
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      if (useSupabase) await supabase.from('contacts').delete().eq('id', selectedContact.id);
      setView('list');
      setSelectedContact(null);
    }
  };

  const addReminder = async (data = null) => {
    const rem = data || newReminder;
    if (!rem.date || !rem.note) return;
    const newRem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), ...rem };
    const updated = { ...selectedContact, reminders: [...(selectedContact.reminders || []), newRem] };
    setContacts(prev => prev.map(c => c.id === selectedContact.id ? updated : c));
    setSelectedContact(updated);
    if (useSupabase) {
      await supabase.from('reminders').insert({
        contact_id: selectedContact.id, note: newRem.note, reminder_date: newRem.date,
        reminder_time: newRem.time || null, reminder_type: newRem.type
      });
    }
    if (!data) { setNewReminder({ note: '', date: '', time: '', type: 'notification' }); setShowReminderModal(false); }
  };

  const removeReminder = async (id) => {
    const updated = { ...selectedContact, reminders: selectedContact.reminders.filter(r => r.id !== id) };
    setContacts(prev => prev.map(c => c.id === selectedContact.id ? updated : c));
    setSelectedContact(updated);
    if (useSupabase) await supabase.from('reminders').delete().eq('id', id);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        if (final) setTranscript(prev => (prev + ' ' + final).trim());
        setInterimTranscript(interim);
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript(''); setInterimTranscript(''); setAiResult(null); setAiError(null);
      try { recognitionRef.current.start(); setIsRecording(true); } catch {}
    } else { alert('Speech recognition not supported. Use Chrome, Edge, or Safari.'); }
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsRecording(false);
    setInterimTranscript('');
    const final = transcript.trim();
    if (!final) return;
    setIsProcessingAI(true);
    setAiError(null);
    try {
      const result = await processVoiceWithAI(final, `${selectedContact.firstName} ${selectedContact.lastName}`.trim());
      if (result.error) setAiError(result.error);
      setAiResult(result);
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newNotes = tempNotes ? `${tempNotes}\n\n[${timestamp}] ${result.summary}` : `[${timestamp}] ${result.summary}`;
      setTempNotes(newNotes);
      const updates = { notes: newNotes };
      if (result.reminders?.length > 0) {
        const newRems = result.reminders.map(r => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          note: r.note, date: r.date, time: r.time || '', type: r.type || 'notification'
        }));
        updates.reminders = [...(selectedContact.reminders || []), ...newRems];
        if (useSupabase) {
          for (const rem of newRems) {
            await supabase.from('reminders').insert({
              contact_id: selectedContact.id, note: rem.note, reminder_date: rem.date,
              reminder_time: rem.time || null, reminder_type: rem.type
            });
          }
        }
      }
      updateContact(updates);
    } catch (error) {
      setAiError(error.message);
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newNotes = tempNotes ? `${tempNotes}\n\n[${timestamp}] ${final}` : `[${timestamp}] ${final}`;
      setTempNotes(newNotes);
      updateContact({ notes: newNotes });
    }
    setIsProcessingAI(false);
    setTranscript('');
  };

  const handlePhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (isEdit) setEditForm(prev => ({ ...prev, photo: reader.result }));
      else updateContact({ photo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const groupedContacts = contacts
    .filter(c => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || (c.company || '').toLowerCase().includes(q);
    })
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    .reduce((acc, c) => {
      const letter = c.firstName?.[0]?.toUpperCase() || '#';
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(c);
      return acc;
    }, {});

  const scrollToSection = (l) => sectionRefs.current[l]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openContactDetail = (c) => { setSelectedContact(c); setTempNotes(c.notes || ''); setAiResult(null); setAiError(null); setTranscript(''); setView('detail'); };
  const openEditContact = (c) => { setEditForm({ ...c }); setView('edit'); };
  const openNewContact = () => { setEditForm({ id: Date.now().toString(), firstName: '', lastName: '', jobTitle: '', company: '', phone: '', email: '', notes: '', knownThrough: null, reminders: [], photo: null }); setSelectedContact(null); setView('new'); };
  const getContactName = (id) => { const c = contacts.find(x => x.id === id); return c ? `${c.firstName} ${c.lastName}`.trim() : ''; };
  const getInitials = (c) => c ? ((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase() || '?' : '?';
  const filteredPicker = contacts.filter(c => c.id !== (editForm.id || selectedContact?.id)).filter(c => !knownThroughSearch || `${c.firstName} ${c.lastName}`.toLowerCase().includes(knownThroughSearch.toLowerCase()));

  const colors = { blue: '#007AFF', gray: '#8E8E93', separator: 'rgba(60,60,67,0.29)', separatorLight: 'rgba(60,60,67,0.12)', background: '#F2F2F7', white: '#FFFFFF', black: '#000000', green: '#34C759', red: '#FF3B30', purple: '#5856D6', orange: '#FF9500' };

  if (loading) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', minHeight: '100vh', background: colors.background, maxWidth: '430px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '17px', color: colors.gray }}>Loading...</div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', minHeight: '100vh', background: colors.white, maxWidth: '430px', margin: '0 auto', WebkitFontSmoothing: 'antialiased' }}>
        <div style={{ padding: '59px 16px 11px', background: 'rgba(249,249,249,0.94)', backdropFilter: 'saturate(180%) blur(20px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `0.33px solid ${colors.separator}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '17px', fontWeight: '600', letterSpacing: '-0.4px' }}>Contacts</span>
          </div>
        </div>
        <div style={{ paddingBottom: '88px' }}>
          {Object.keys(groupedContacts).sort().map(letter => (
            <div key={letter} ref={el => sectionRefs.current[letter] = el}>
              <div style={{ padding: '4px 16px 6px', fontSize: '14px', fontWeight: '600', background: colors.background }}>{letter}</div>
              {groupedContacts[letter].map((c, idx, arr) => (
                <div key={c.id} onClick={() => openContactDetail(c)} style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', cursor: 'pointer' }}>
                  {c.photo ? <img src={c.photo} alt="" style={{ width: '40px', height: '40px', borderRadius: '20px', marginRight: '12px', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'linear-gradient(180deg, #B8C5D6 0%, #8E99A9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: '17px', marginRight: '12px' }}>{getInitials(c)}</div>}
                  <div style={{ flex: 1, paddingTop: '10px', paddingBottom: '10px', borderBottom: idx < arr.length - 1 ? `0.33px solid ${colors.separatorLight}` : 'none' }}>
                    <span style={{ fontSize: '17px' }}>{c.firstName}</span>
                    {c.lastName && <span style={{ fontSize: '17px', fontWeight: '600' }}> {c.lastName}</span>}
                    {c.reminders?.length > 0 && <span style={{ marginLeft: '8px', padding: '2px 6px', background: colors.orange, color: colors.white, borderRadius: '8px', fontSize: '10px', fontWeight: '600' }}>{c.reminders.length}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {contacts.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>No contacts yet</div>
              <div style={{ fontSize: '15px', color: colors.gray, marginBottom: '20px' }}>Tap + to add your first contact</div>
            </div>
          )}
        </div>
        <div style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 200 }}>
          {alphabet.map(l => <div key={l} onClick={() => scrollToSection(l)} style={{ fontSize: '11px', fontWeight: '600', color: colors.blue, padding: '0.5px 4px', cursor: 'pointer' }}>{l}</div>)}
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', padding: '8px 16px 34px', background: 'rgba(249,249,249,0.94)', backdropFilter: 'saturate(180%) blur(20px)', borderTop: `0.33px solid ${colors.separator}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '10px', background: 'rgba(118,118,128,0.12)' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.46243 10.5376 2 7.5 2C4.46243 2 2 4.46243 2 7.5C2 10.5376 4.46243 13 7.5 13Z" stroke={colors.gray} strokeWidth="1.5"/><path d="M11.5 11.5L15 15" stroke={colors.gray} strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '17px', outline: 'none' }} />
          </div>
          <button onClick={openNewContact} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '30px', fontWeight: '300', cursor: 'pointer' }}>+</button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedContact) {
    const knownContact = selectedContact.knownThrough ? contacts.find(c => c.id === selectedContact.knownThrough) : null;
    const hasWork = selectedContact.jobTitle || selectedContact.company;
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', minHeight: '100vh', background: 'linear-gradient(180deg, #E8ECF2 0%, #D5DBE5 20%, #B8C2D0 45%, #9AA8B8 70%, #7D8A9A 100%)', maxWidth: '430px', margin: '0 auto', WebkitFontSmoothing: 'antialiased' }}>
        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, false)} />
        <div style={{ padding: '59px 16px 8px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="10" height="18" viewBox="0 0 10 18"><path d="M9 1L1 9L9 17" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </button>
          <button onClick={() => openEditContact(selectedContact)} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', cursor: 'pointer' }}>Edit</button>
        </div>
        <div onClick={() => fileInputRef.current?.click()} style={{ width: '110px', height: '110px', borderRadius: '55px', background: selectedContact.photo ? 'none' : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)', backdropFilter: 'blur(40px)', border: '0.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 14px', color: 'rgba(255,255,255,0.95)', fontSize: '44px', fontWeight: '300', cursor: 'pointer', overflow: 'hidden' }}>
          {selectedContact.photo ? <img src={selectedContact.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(selectedContact)}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '22px', padding: '0 20px' }}>
          <div style={{ fontSize: '27px', fontWeight: '600', letterSpacing: '-0.6px' }}>{selectedContact.firstName} {selectedContact.lastName}</div>
          {hasWork && <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.55)', marginTop: '3px' }}>{selectedContact.jobTitle}{selectedContact.jobTitle && selectedContact.company && ' • '}{selectedContact.company}</div>}
          {knownContact ? <div onClick={() => openContactDetail(knownContact)} style={{ fontSize: '14px', color: colors.blue, marginTop: '3px', cursor: 'pointer' }}>via {knownContact.firstName} {knownContact.lastName}</div> : <button onClick={() => setShowKnownThroughPicker(true)} style={{ fontSize: '14px', color: 'rgba(0,0,0,0.35)', marginTop: '5px', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add how you know them</button>}
        </div>
        <div style={{ padding: '0 16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(40px)', borderRadius: '10px', marginBottom: '9px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', gap: '12px' }}>
              {selectedContact.photo ? <img src={selectedContact.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '17px', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '17px', background: 'linear-gradient(180deg, #B8C5D6 0%, #8E99A9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: '15px' }}>{getInitials(selectedContact)}</div>}
              <span style={{ flex: 1, fontSize: '16px' }}>Contact Photo & Poster</span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke="rgba(60,60,67,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(40px)', borderRadius: '10px', marginBottom: '9px' }}>
            {selectedContact.phone && (
              <div style={{ padding: '10px 14px', borderBottom: '0.33px solid rgba(60,60,67,0.15)' }}>
                <div style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginBottom: '2px' }}>phone</div>
                <a href={`tel:${selectedContact.phone}`} style={{ fontSize: '16px', color: colors.blue, textDecoration: 'none' }}>{selectedContact.phone}</a>
              </div>
            )}
            {selectedContact.email && (
              <div style={{ padding: '10px 14px', borderBottom: '0.33px solid rgba(60,60,67,0.15)' }}>
                <div style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginBottom: '2px' }}>email</div>
                <a href={`mailto:${selectedContact.email}`} style={{ fontSize: '16px', color: colors.blue, textDecoration: 'none' }}>{selectedContact.email}</a>
              </div>
            )}
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginBottom: '4px' }}>Notes</div>
              <textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} onBlur={() => updateContact({ notes: tempNotes })} placeholder="Add notes..." style={{ width: '100%', minHeight: '60px', border: 'none', background: 'transparent', fontSize: '16px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.35' }} />
              {aiResult && (aiResult.keyFacts?.length > 0 || aiResult.suggestedFollowUp) && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,122,255,0.08)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: colors.blue, fontWeight: '600', marginBottom: '6px' }}>🤖 AI DETECTED</div>
                  {aiResult.keyFacts?.map((f, i) => <div key={i} style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)', marginBottom: '3px' }}>• {f}</div>)}
                  {aiResult.suggestedFollowUp && <div style={{ fontSize: '13px', color: colors.blue, marginTop: '6px', fontStyle: 'italic' }}>💡 {aiResult.suggestedFollowUp}</div>}
                </div>
              )}
              {aiError && <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,59,48,0.08)', borderRadius: '8px' }}><div style={{ fontSize: '13px', color: colors.red }}>⚠️ {aiError}</div></div>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px', borderTop: '0.33px solid rgba(60,60,67,0.15)', marginTop: '12px' }}>
                {isRecording && (
                  <div style={{ marginBottom: '10px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.red, fontSize: '13px', marginBottom: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: colors.red, animation: 'pulse 1s infinite' }}></div>
                      Recording... tap to stop
                    </div>
                    {(transcript || interimTranscript) && <div style={{ padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', fontSize: '14px', color: '#333' }}>{transcript}<span style={{ color: '#999' }}> {interimTranscript}</span></div>}
                  </div>
                )}
                {isProcessingAI && <div style={{ marginBottom: '10px', padding: '10px 16px', background: 'rgba(0,122,255,0.1)', borderRadius: '8px', color: colors.blue, fontSize: '14px' }}>🤖 AI analyzing...</div>}
                <button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessingAI} style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', background: isRecording ? colors.red : colors.blue, cursor: isProcessingAI ? 'not-allowed' : 'pointer', opacity: isProcessingAI ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', transform: isRecording ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.1s' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.white}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>
                <div style={{ fontSize: '11px', color: 'rgba(60,60,67,0.45)', marginTop: '8px' }}>Voice note • AI summarizes & sets reminders</div>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(40px)', borderRadius: '10px', marginBottom: '9px' }}>
            <div style={{ padding: '10px 14px', borderBottom: selectedContact.reminders?.length ? '0.33px solid rgba(60,60,67,0.15)' : 'none' }}>
              <div style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginBottom: '6px' }}>Reminders</div>
              <button onClick={() => setShowReminderModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '500' }}>+</div>
                <span style={{ fontSize: '16px', color: colors.blue }}>Add Reminder</span>
              </button>
            </div>
            {selectedContact.reminders?.map((r, i) => (
              <div key={r.id} style={{ padding: '10px 14px', borderBottom: i < selectedContact.reminders.length - 1 ? '0.33px solid rgba(60,60,67,0.15)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px' }}>{r.note}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginTop: '2px' }}>
                    {r.date}{r.time && ` at ${r.time}`}
                    <span style={{ marginLeft: '6px', padding: '2px 7px', background: r.type === 'email' ? colors.purple : r.type === 'text' ? colors.green : colors.blue, color: colors.white, borderRadius: '8px', fontSize: '11px', fontWeight: '500' }}>{r.type}</span>
                  </div>
                </div>
                <button onClick={() => removeReminder(r.id)} style={{ background: 'none', border: 'none', color: colors.red, fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            {(!selectedContact.reminders || !selectedContact.reminders.length) && <div style={{ padding: '0 14px 10px', fontSize: '14px', color: 'rgba(60,60,67,0.35)' }}>No reminders set</div>}
          </div>
          <button onClick={deleteContact} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(40px)', borderRadius: '10px', border: 'none', fontSize: '16px', color: colors.red, cursor: 'pointer', marginBottom: '9px' }}>Delete Contact</button>
        </div>
        <div style={{ height: '40px' }}></div>
        {showKnownThroughPicker && (
          <div onClick={() => { setShowKnownThroughPicker(false); setKnownThroughSearch(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.background, borderRadius: '14px 14px 0 0', width: '100%', maxWidth: '430px', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.33px solid ${colors.separator}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '50px' }}></div>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>Known Through</span>
                <button onClick={() => { setShowKnownThroughPicker(false); setKnownThroughSearch(''); }} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', fontWeight: '600', cursor: 'pointer', width: '50px', textAlign: 'right' }}>Done</button>
              </div>
              <div style={{ padding: '6px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '10px', background: 'rgba(118,118,128,0.12)' }}>
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.46243 10.5376 2 7.5 2C4.46243 2 2 4.46243 2 7.5C2 10.5376 4.46243 13 7.5 13Z" stroke={colors.gray} strokeWidth="1.5"/><path d="M11.5 11.5L15 15" stroke={colors.gray} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input type="text" placeholder="Search" value={knownThroughSearch} onChange={e => setKnownThroughSearch(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '17px', outline: 'none' }} autoFocus />
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ background: colors.white, margin: '0 16px 20px', borderRadius: '10px', overflow: 'hidden' }}>
                  <button onClick={() => { updateContact({ knownThrough: null }); setShowKnownThroughPicker(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', cursor: 'pointer', color: colors.gray }}>None{!selectedContact.knownThrough && <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 5.5L5 9.5L13 1.5" stroke={colors.blue} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button>
                  {filteredPicker.map((c, i, arr) => (
                    <button key={c.id} onClick={() => { updateContact({ knownThrough: c.id }); setShowKnownThroughPicker(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `0.33px solid ${colors.separatorLight}` : 'none', fontSize: '17px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {c.photo ? <img src={c.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '17px', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '17px', background: 'linear-gradient(180deg, #B8C5D6 0%, #8E99A9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: '14px' }}>{getInitials(c)}</div>}
                        <span>{c.firstName} {c.lastName}</span>
                      </div>
                      {selectedContact.knownThrough === c.id && <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 5.5L5 9.5L13 1.5" stroke={colors.blue} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {showReminderModal && (
          <div onClick={() => setShowReminderModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.background, borderRadius: '14px 14px 0 0', width: '100%', maxWidth: '430px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <button onClick={() => setShowReminderModal(false)} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', cursor: 'pointer' }}>Cancel</button>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>Add Reminder</span>
                <button onClick={() => addReminder()} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', fontWeight: '600', cursor: 'pointer' }}>Add</button>
              </div>
              <div style={{ background: colors.white, borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                <input type="text" placeholder="What to remember?" value={newReminder.note} onChange={e => setNewReminder({ ...newReminder, note: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', outline: 'none', boxSizing: 'border-box' }} />
                <input type="date" value={newReminder.date} onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', outline: 'none', boxSizing: 'border-box' }} />
                <input type="time" value={newReminder.time} onChange={e => setNewReminder({ ...newReminder, time: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: 'none', fontSize: '17px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: colors.white, borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 16px', fontSize: '13px', color: colors.gray }}>Notify via</div>
                {['notification', 'email', 'text'].map(t => (
                  <button key={t} onClick={() => setNewReminder({ ...newReminder, type: t })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderTop: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t}{newReminder.type === t && <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 5.5L5 9.5L13 1.5" stroke={colors.blue} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  if (view === 'edit' || view === 'new') {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', minHeight: '100vh', background: colors.background, maxWidth: '430px', margin: '0 auto', WebkitFontSmoothing: 'antialiased' }}>
        <input type="file" ref={editFileInputRef} accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, true)} />
        <div style={{ padding: '59px 16px 11px', background: 'rgba(249,249,249,0.94)', backdropFilter: 'saturate(180%) blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: `0.33px solid ${colors.separator}` }}>
          <button onClick={() => selectedContact ? setView('detail') : setView('list')} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', cursor: 'pointer' }}>Cancel</button>
          <span style={{ fontSize: '17px', fontWeight: '600' }}>{view === 'new' ? 'New Contact' : 'Edit'}</span>
          <button onClick={saveContact} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', fontWeight: '600', cursor: 'pointer' }}>Done</button>
        </div>
        <div onClick={() => editFileInputRef.current?.click()} style={{ width: '110px', height: '110px', borderRadius: '55px', background: editForm.photo ? 'none' : 'linear-gradient(180deg, #B8C5D6 0%, #8E99A9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 10px', cursor: 'pointer', overflow: 'hidden' }}>
          {editForm.photo ? <img src={editForm.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="55" height="55" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/></svg>}
        </div>
        <button onClick={() => editFileInputRef.current?.click()} style={{ display: 'block', margin: '0 auto 24px', background: 'transparent', border: 'none', fontSize: '15px', color: colors.blue, cursor: 'pointer' }}>{editForm.photo ? 'Change Photo' : 'Add Photo'}</button>
        <div style={{ background: colors.white, borderRadius: '10px', margin: '0 16px 9px', overflow: 'hidden' }}>
          <input type="text" placeholder="First name" value={editForm.firstName || ''} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} style={{ width: '100%', padding: '11px 16px', border: 'none', borderBottom: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', outline: 'none', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Last name" value={editForm.lastName || ''} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} style={{ width: '100%', padding: '11px 16px', border: 'none', fontSize: '17px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ background: colors.white, borderRadius: '10px', margin: '0 16px 9px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', borderBottom: `0.33px solid ${colors.separatorLight}` }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', marginRight: '12px' }}>+</div>
            <input type="text" placeholder="add job title" value={editForm.jobTitle || ''} onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })} style={{ flex: 1, border: 'none', fontSize: '17px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', marginRight: '12px' }}>+</div>
            <input type="text" placeholder="add company" value={editForm.company || ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })} style={{ flex: 1, border: 'none', fontSize: '17px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ background: colors.white, borderRadius: '10px', margin: '0 16px 9px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', borderBottom: `0.33px solid ${colors.separatorLight}` }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', marginRight: '12px' }}>+</div>
            <input type="tel" placeholder="add phone" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ flex: 1, border: 'none', fontSize: '17px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', marginRight: '12px' }}>+</div>
            <input type="email" placeholder="add email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ flex: 1, border: 'none', fontSize: '17px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ background: colors.white, borderRadius: '10px', margin: '0 16px 9px', overflow: 'hidden' }}>
          <button onClick={() => setShowKnownThroughPicker(true)} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '11px', background: colors.green, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', marginRight: '12px' }}>+</div>
            <span style={{ fontSize: '17px', color: editForm.knownThrough ? colors.black : colors.gray }}>{editForm.knownThrough ? `via ${getContactName(editForm.knownThrough)}` : 'add how you know them'}</span>
          </button>
        </div>
        <div style={{ background: colors.white, borderRadius: '10px', margin: '0 16px 9px', overflow: 'hidden' }}>
          <div style={{ padding: '11px 16px' }}>
            <textarea placeholder="Notes" value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ width: '100%', minHeight: '70px', border: 'none', fontSize: '17px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.35' }} />
          </div>
        </div>
        <div style={{ height: '40px' }}></div>
        {showKnownThroughPicker && (
          <div onClick={() => { setShowKnownThroughPicker(false); setKnownThroughSearch(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.background, borderRadius: '14px 14px 0 0', width: '100%', maxWidth: '430px', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.33px solid ${colors.separator}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '50px' }}></div>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>Known Through</span>
                <button onClick={() => { setShowKnownThroughPicker(false); setKnownThroughSearch(''); }} style={{ background: 'none', border: 'none', color: colors.blue, fontSize: '17px', fontWeight: '600', cursor: 'pointer', width: '50px', textAlign: 'right' }}>Done</button>
              </div>
              <div style={{ padding: '6px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '10px', background: 'rgba(118,118,128,0.12)' }}>
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.46243 10.5376 2 7.5 2C4.46243 2 2 4.46243 2 7.5C2 10.5376 4.46243 13 7.5 13Z" stroke={colors.gray} strokeWidth="1.5"/><path d="M11.5 11.5L15 15" stroke={colors.gray} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input type="text" placeholder="Search" value={knownThroughSearch} onChange={e => setKnownThroughSearch(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '17px', outline: 'none' }} autoFocus />
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ background: colors.white, margin: '0 16px 20px', borderRadius: '10px', overflow: 'hidden' }}>
                  <button onClick={() => { setEditForm({ ...editForm, knownThrough: null }); setShowKnownThroughPicker(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: `0.33px solid ${colors.separatorLight}`, fontSize: '17px', cursor: 'pointer', color: colors.gray }}>None{!editForm.knownThrough && <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 5.5L5 9.5L13 1.5" stroke={colors.blue} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button>
                  {filteredPicker.map((c, i, arr) => (
                    <button key={c.id} onClick={() => { setEditForm({ ...editForm, knownThrough: c.id }); setShowKnownThroughPicker(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `0.33px solid ${colors.separatorLight}` : 'none', fontSize: '17px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {c.photo ? <img src={c.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '17px', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '17px', background: 'linear-gradient(180deg, #B8C5D6 0%, #8E99A9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: '14px' }}>{getInitials(c)}</div>}
                        <span>{c.firstName} {c.lastName}</span>
                      </div>
                      {editForm.knownThrough === c.id && <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 5.5L5 9.5L13 1.5" stroke={colors.blue} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
