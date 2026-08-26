import React, { useState } from 'react';
import { Send, MapPin, Sparkles, Image, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, KeyRound, Phone, User, Lock } from 'lucide-react';
import { validateAadhaar, formatAadhaar, maskAadhaar } from '../utils/aadhaar';

const PUNJAB_CITIES = [
  { name: 'Ludhiana', lat: 30.901, lng: 75.8573 },
  { name: 'Jalandhar', lat: 31.326, lng: 75.5762 },
  { name: 'Amritsar', lat: 31.634, lng: 74.8723 },
  { name: 'Patiala', lat: 30.3398, lng: 76.3869 },
  { name: 'Bathinda', lat: 30.211, lng: 74.9455 },
  { name: 'Mohali', lat: 30.7046, lng: 76.7179 },
];

export default function ReportForm({ onReportSubmitted }) {
  // Citizen Details & Aadhaar State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [demoOtpHit, setDemoOtpHit] = useState(null);

  // Incident & Form State
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(30.901);
  const [longitude, setLongitude] = useState(75.8573);
  const [locationName, setLocationName] = useState('Ludhiana (Default)');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [triageResult, setTriageResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [otpError, setOtpError] = useState(null);

  // Handle Aadhaar formatting
  const handleAadhaarChange = (e) => {
    const raw = e.target.value;
    const formatted = formatAadhaar(raw);
    setAadhaarNumber(formatted);
    setOtpSent(false);
    setAadhaarVerified(false);
    setOtpError(null);
  };

  // Send UIDAI OTP
  const handleSendOtp = async () => {
    const clean = aadhaarNumber.replace(/\D/g, '');
    if (clean.length !== 12) {
      setOtpError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/auth/aadhaar-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: clean, phone_number: citizenPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.');

      setOtpSent(true);
      setDemoOtpHit(data.demo_otp_hint || '123456');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify UIDAI OTP
  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const clean = aadhaarNumber.replace(/\D/g, '');
      const res = await fetch('/api/auth/aadhaar-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: clean, otp: otpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid OTP.');

      setAadhaarVerified(true);
      setOtpError(null);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Quick Demo Verification bypass button for fast testing
  const handleQuickAadhaarVerify = () => {
    setAadhaarNumber('9876-5432-1098');
    if (!citizenName) setCitizenName('Gurpreet Singh (Verified Citizen)');
    if (!citizenPhone) setCitizenPhone('+91 98140 12345');
    setAadhaarVerified(true);
    setOtpSent(true);
    setOtpError(null);
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationName('Live GPS Coordinates');
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        setErrorMsg('Could not fetch GPS location. Selected preset instead.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectCity = (city) => {
    setLatitude(city.lat);
    setLongitude(city.lng);
    setLocationName(city.name);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe the emergency incident.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setTriageResult(null);

    try {
      const payload = {
        description: description.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_url: imagePreview,
        citizen_name: citizenName.trim() || 'Verified Citizen',
        citizen_phone: citizenPhone.trim() || '',
        aadhaar_number: aadhaarNumber.replace(/\D/g, ''),
        aadhaar_verified: aadhaarVerified,
      };

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setTriageResult(data);
      setDescription('');
      setImagePreview(null);
      if (onReportSubmitted) {
        onReportSubmitted(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit report. Ensure backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadExample = (text, cityIdx) => {
    setDescription(text);
    handleSelectCity(PUNJAB_CITIES[cityIdx]);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Citizen Emergency Dispatch Portal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verified reports receive priority response and are instantly routed to emergency command.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            UIDAI Aadhaar Security Layer Active
          </span>
        </div>
      </div>

      {/* Aadhaar Citizen Verification Security Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Step 1: Citizen Identity Verification (Aadhaar / UIDAI)
            </h3>
          </div>
          {!aadhaarVerified && (
            <button
              type="button"
              onClick={handleQuickAadhaarVerify}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white transition shadow"
            >
              ⚡ 1-Click Demo Aadhaar Verification
            </button>
          )}
        </div>

        {aadhaarVerified ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-300">Identity Authenticated via UIDAI</div>
                <div className="text-sm font-mono text-emerald-200">
                  {maskAadhaar(aadhaarNumber)} • <span className="font-sans font-bold">{citizenName || 'Gurpreet Singh'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setAadhaarVerified(false); setOtpSent(false); }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Change ID
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Gurpreet Singh"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" /> Mobile Number
                </label>
                <input
                  type="text"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  placeholder="e.g. 98140 12345"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 12-Digit Aadhaar */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 12-Digit Aadhaar
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    maxLength={14}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || aadhaarNumber.replace(/\D/g, '').length !== 12}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold whitespace-nowrap transition shadow"
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>
            </div>

            {/* OTP Verification Prompt */}
            {otpSent && (
              <div className="p-3 bg-indigo-950/50 border border-indigo-500/40 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-indigo-200">
                    OTP sent to Aadhaar-linked phone. <span className="font-mono text-amber-300 font-bold">(Demo OTP: {demoOtpHit || '123456'})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit OTP"
                    className="w-28 bg-slate-950 border border-indigo-500/60 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono text-slate-100 tracking-widest focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || !otpInput}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <div className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {otpError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Test Scenario Buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Test Scenarios (Punjab):</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadExample("Aag lag gayi hai godown mein near Ludhiana grain market, dhuan bahut zyada hai!", 0)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            🔥 Ludhiana Fire (Hinglish)
          </button>
          <button
            type="button"
            onClick={() => loadExample("Bus overturned on Jalandhar-Amritsar highway, multiple passengers injured, urgent help needed", 1)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            🚧 Highway Overturn
          </button>
          <button
            type="button"
            onClick={() => loadExample("Heavy rain se galiyan mein paani bhar gaya hai in Ranjit Avenue, water entering homes", 2)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            🌊 Amritsar Flood
          </button>
          <button
            type="button"
            onClick={() => loadExample("My father collapsed suddenly, diabetic, not responding, need ambulance immediately", 0)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            🚑 Medical Collapse
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Incident Description */}
        <div className="space-y-1.5">
          <label htmlFor="report-desc" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Step 2: Emergency Description <span className="text-red-400">*</span></span>
            <span className="text-[11px] text-slate-500 font-normal">Supports Hindi, Punjabi, Hinglish & English</span>
          </label>
          <textarea
            id="report-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what is happening, casualties, trapped people, road conditions..."
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
            required
          />
        </div>

        {/* Location Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Step 3: Location Coordinates ({locationName})
            </label>
            <button
              type="button"
              onClick={handleGetGPS}
              disabled={gettingLocation}
              className="text-xs px-2.5 py-1 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-600 transition flex items-center gap-1 shadow"
            >
              <MapPin className="w-3.5 h-3.5" />
              {gettingLocation ? 'Acquiring GPS...' : 'Use My Live GPS'}
            </button>
          </div>

          {/* Punjab Presets */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PUNJAB_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectCity(c)}
                className={`text-xs py-2 px-2 rounded-xl border text-center transition font-semibold ${
                  locationName === c.name
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
            <span>Latitude: <strong className="text-slate-200">{parseFloat(latitude).toFixed(4)}</strong></span>
            <span>Longitude: <strong className="text-slate-200">{parseFloat(longitude).toFixed(4)}</strong></span>
          </div>
        </div>

        {/* Optional Image Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Image className="w-4 h-4 text-slate-400" />
            Attach Emergency Scene Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
          />
          {imagePreview && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-700 max-h-40 w-full">
              <img src={imagePreview} alt="Upload preview" className="object-cover w-full h-40" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-white text-xs hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-indigo-600 to-amber-500 hover:from-red-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-red-950/40 transition hover:scale-[1.01]"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              AI Analyzing, Verifying & Dispatching...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Incident & Alert Emergency Command
            </>
          )}
        </button>
      </form>

      {/* AI Triage Live Result Banner */}
      {triageResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/50 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <CheckCircle className="w-5 h-5" />
              Incident #{triageResult.id} Dispatched to Operations Board
            </div>
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 font-bold">
              {triageResult.verification_badge || 'Citizen Verified 🛡️'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Type</span>
              <span className="font-extrabold text-slate-100 capitalize">{triageResult.type}</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Severity</span>
              <span className={`font-extrabold uppercase ${
                triageResult.severity === 'critical' ? 'text-red-400' : triageResult.severity === 'high' ? 'text-orange-400' : 'text-amber-300'
              }`}>{triageResult.severity}</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Casualties</span>
              <span className="font-extrabold text-slate-100 font-mono">{triageResult.people_affected || 0}</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Units</span>
              <span className="font-extrabold text-indigo-300">
                {triageResult.required_teams?.join(', ') || 'Police'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
