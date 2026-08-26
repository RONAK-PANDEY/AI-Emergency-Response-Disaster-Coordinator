import React, { useState } from 'react';

const AADHAAR_PROFILES = [
  { aadhaar: '548291023341', name: 'Harpreet Kaur', phone: '9876543210', dob: '1990-03-14' },
  { aadhaar: '734819205647', name: 'Rajesh Kumar', phone: '9812345678', dob: '1985-07-22' },
  { aadhaar: '912374856203', name: 'Sukhbir Singh', phone: '9988776655', dob: '1978-11-05' },
];

export default function AadhaarVerificationPanel({ onVerified, onAnonymous }) {
  const [mode, setMode] = useState(null); // null | 'aadhaar' | 'anonymous'
  const [aadhaar, setAadhaar] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleAadhaarChange = (e) => {
    setAadhaar(formatAadhaar(e.target.value));
    setError('');
  };

  const autofill = (profile) => {
    setAadhaar(formatAadhaar(profile.aadhaar));
    setName(profile.name);
    setPhone(profile.phone);
    setDob(profile.dob);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const clean = aadhaar.replace(/\s/g, '');
    if (clean.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!name.trim()) { setError('Full name is required.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/verify-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: clean, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      setVerified(true);
      setVerifiedData({ name: name.trim(), phone, maskedAadhaar: data.masked_aadhaar });
      onVerified({ name: name.trim(), phone, aadhaar: clean, maskedAadhaar: data.masked_aadhaar });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verified && verifiedData) {
    return (
      <div className="card p-5 border-l-4 border-[#15803D]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#15803D] font-bold text-lg shrink-0">✓</div>
          <div>
            <div className="text-sm font-semibold text-[#15803D]">Identity Verified — UIDAI Aadhaar Sandbox</div>
            <div className="text-xs text-[#334155] mt-1">Citizen: <strong>{verifiedData.name}</strong></div>
            <div className="text-xs text-[#334155]">Aadhaar: <strong>{verifiedData.maskedAadhaar}</strong></div>
            {verifiedData.phone && <div className="text-xs text-[#334155]">Contact: {verifiedData.phone}</div>}
            <div className="text-[10px] text-[#94A3B8] mt-2 uppercase tracking-wide">Your report will carry a Verified Citizen badge. Identity is stored as a secure cryptographic hash per UIDAI protocols.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="card p-6">
        <div className="section-heading mb-4">Step 1 — Identity Protocol Selection</div>
        <p className="text-sm text-[#334155] mb-5">Select your reporting mode. Aadhaar-verified reports receive higher response priority.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMode('aadhaar')}
            className="border-2 border-[#003366] rounded-sm p-4 text-left transition-colors hover:bg-[#EFF6FF]"
          >
            <div className="font-semibold text-[#003366] text-sm mb-1">Protocol A — Verified Identity</div>
            <div className="text-xs text-[#334155]">Authenticate via UIDAI Aadhaar e-KYC Sandbox. Report carries verified credibility badge and receives priority dispatch.</div>
            <div className="mt-2 text-[10px] text-[#94A3B8] uppercase tracking-wide">Recommended for high-priority incidents</div>
          </button>
          <button
            onClick={() => { setMode('anonymous'); onAnonymous(); }}
            className="border border-[#CBD5E1] rounded-sm p-4 text-left transition-colors hover:bg-[#F3F4F6]"
          >
            <div className="font-semibold text-[#0F172A] text-sm mb-1">Protocol B — Anonymous Filing</div>
            <div className="text-xs text-[#334155]">File without identity disclosure. Report will be reviewed but may receive lower initial priority. No personal data stored.</div>
            <div className="mt-2 text-[10px] text-[#94A3B8] uppercase tracking-wide">Whistleblower / sensitive situations</div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'aadhaar') {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="section-heading">Step 1 — UIDAI Aadhaar e-KYC Verification (Sandbox)</div>
          <button onClick={() => setMode(null)} className="text-xs text-[#003366] hover:underline">Back</button>
        </div>

        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-sm p-3 mb-4 text-xs text-[#92400E]">
          <strong>Evaluation Sandbox Active.</strong> Enter any valid 12-digit number or use a demo profile below. No real Aadhaar data is transmitted.
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-[#334155] mb-2">One-click demo profiles:</div>
          <div className="flex flex-wrap gap-2">
            {AADHAAR_PROFILES.map((p, i) => (
              <button key={i} onClick={() => autofill(p)} className="btn-secondary text-xs py-1 px-3">
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="label">Aadhaar Number <span className="text-[#B91C1C]">*</span></label>
            <input
              type="text"
              className="input-field font-mono tracking-widest"
              placeholder="XXXX XXXX XXXX"
              value={aadhaar}
              onChange={handleAadhaarChange}
              maxLength={14}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name (as on Aadhaar) <span className="text-[#B91C1C]">*</span></label>
              <input type="text" className="input-field" placeholder="Enter full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Mobile Number (Optional)</label>
            <input type="tel" className="input-field" placeholder="10-digit mobile" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm p-2 text-xs text-[#B91C1C]">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
