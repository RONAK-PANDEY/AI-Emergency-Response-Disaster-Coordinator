import React, { useState } from 'react';
import AadhaarVerification from '../components/AadhaarVerification';

const INCIDENT_TEMPLATES = [
  { label: 'River Flooding', type: 'flood', severity: 'high', description: 'Flash flooding reported near Sutlej riverbank. Water level rising rapidly. Multiple families stranded on rooftops. Immediate rescue boats required.' },
  { label: 'Building Fire', type: 'fire', severity: 'critical', description: 'Severe fire in 3-storey residential building. Flames visible from multiple floors. Residents trapped on upper floors. Fire brigade and ambulance required urgently.' },
  { label: 'Road Accident', type: 'accident', severity: 'high', description: 'Major road collision involving truck and two passenger vehicles on GT Road. Multiple persons injured. Traffic severely blocked. Police and medical assistance needed.' },
  { label: 'Medical Emergency', type: 'medical', severity: 'critical', description: 'Cardiac arrest reported in a public area. Individual unconscious, no response. Immediate ambulance and medical team required.' },
  { label: 'Gas Leak', type: 'other', severity: 'high', description: 'Strong gas odour detected in residential colony. Several residents reporting dizziness. Possible underground pipeline leak. PGCIL and fire brigade required.' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Auto-detect (AI Classification)' },
  { value: 'fire', label: 'Fire / Blaze' },
  { value: 'flood', label: 'Flood / Waterlogging' },
  { value: 'accident', label: 'Road / Transport Accident' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'other', label: 'Other / General Hazard' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Auto-classify (AI Triage)' },
  { value: 'critical', label: 'Critical — Immediate Life Threat' },
  { value: 'high', label: 'High — Urgent Response Required' },
  { value: 'medium', label: 'Medium — Timely Response' },
  { value: 'low', label: 'Low — Monitoring Required' },
];

export default function ReportPage() {
  const [identityData, setIdentityData] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [identityStep, setIdentityStep] = useState(false);

  const [form, setForm] = useState({
    description: '',
    type: '',
    severity: '',
    latitude: '',
    longitude: '',
    people_affected: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleTemplate = (t) => {
    setForm(f => ({ ...f, description: t.description, type: t.type, severity: t.severity }));
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocationLoading(false);
      },
      () => {
        // Default to Chandigarh if GPS denied
        setForm(f => ({ ...f, latitude: '30.7333', longitude: '76.7794' }));
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setError('Incident description is required.'); return; }
    if (!form.latitude || !form.longitude) { setError('Location coordinates are required. Use "Detect My Location" button.'); return; }

    setLoading(true);
    setError('');

    const payload = {
      description: form.description.trim(),
      type: form.type || null,
      severity: form.severity || null,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      people_affected: form.people_affected ? parseInt(form.people_affected) : 0,
      is_anonymous: isAnonymous,
      reporter_name: identityData?.name || null,
      reporter_aadhaar: identityData?.aadhaar || null,
      reporter_phone: identityData?.phone || null,
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Submission failed');
      setSubmitted(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="card border-l-4 border-[#15803D] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F0FDF4] border border-[#BBF7D0] rounded-sm flex items-center justify-center text-2xl shrink-0">✓</div>
            <div>
              <h2 className="text-lg font-semibold text-[#15803D] mb-1">Incident Report Filed Successfully</h2>
              <p className="text-sm text-[#334155]">Your report has been received by the State Emergency Operations Center. Response teams are being alerted.</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="section-heading mb-3">Official Incident Docket</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="label text-[10px] uppercase tracking-wide">Docket Reference</div>
              <div className="font-mono font-semibold text-[#003366]">PB-INC-{String(submitted.id).padStart(4, '0')}</div>
            </div>
            <div>
              <div className="label text-[10px] uppercase tracking-wide">AI Severity Classification</div>
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full severity-${(submitted.severity || 'unclassified').toLowerCase()}`}>
                  {submitted.severity}
                </span>
              </div>
            </div>
            <div>
              <div className="label text-[10px] uppercase tracking-wide">Incident Type</div>
              <div className="font-medium">{submitted.type}</div>
            </div>
            <div>
              <div className="label text-[10px] uppercase tracking-wide">Required Response Teams</div>
              <div className="font-medium">{submitted.required_team}</div>
            </div>
            <div>
              <div className="label text-[10px] uppercase tracking-wide">Reporter Identity</div>
              <div>{submitted.is_verified ? (
                <span className="text-[#15803D] font-medium">Aadhaar Verified</span>
              ) : submitted.is_anonymous ? (
                <span className="text-[#94A3B8]">Anonymous Filing</span>
              ) : (
                <span className="text-[#92400E]">Unverified</span>
              )}</div>
            </div>
            <div>
              <div className="label text-[10px] uppercase tracking-wide">AI Confidence</div>
              <div className="font-medium">{Math.round((submitted.confidence || 0.94) * 100)}%</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#CBD5E1] text-xs text-[#94A3B8]">
            Filed under Disaster Management Act, 2005 — Section 33(b) | State Disaster Response Force (SDRF) Protocol Initiated
          </div>
        </div>

        <button
          onClick={() => { setSubmitted(null); setForm({ description: '', type: '', severity: '', latitude: '', longitude: '', people_affected: '' }); setIdentityData(null); setIsAnonymous(false); setIdentityStep(false); }}
          className="btn-secondary w-full"
        >
          File Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]">File Emergency Incident Report</h1>
        <p className="text-sm text-[#334155] mt-1">Submit an emergency incident to the State Emergency Operations Center. All reports are reviewed by SEOC dispatch officers.</p>
      </div>

      {/* Identity Step */}
      {!identityStep ? (
        <AadhaarVerification
          onVerified={(data) => { setIdentityData(data); setIsAnonymous(false); setIdentityStep(true); }}
          onAnonymous={() => { setIsAnonymous(true); setIdentityStep(true); }}
        />
      ) : (
        <>
          {isAnonymous && (
            <div className="card p-4 border-l-4 border-[#CBD5E1]">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-[#334155]">Protocol B — Anonymous Filing Active.</span>
                  <span className="text-[#94A3B8] ml-2">No personal data will be stored.</span>
                </div>
                <button onClick={() => setIdentityStep(false)} className="text-xs text-[#003366] hover:underline">Change</button>
              </div>
            </div>
          )}
          {identityData && (
            <div className="card p-4 border-l-4 border-[#15803D]">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-[#15803D] font-medium">Identity Verified</span>
                  <span className="text-[#334155] ml-2">— {identityData.maskedAadhaar}</span>
                </div>
                <button onClick={() => { setIdentityStep(false); setIdentityData(null); }} className="text-xs text-[#003366] hover:underline">Change</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Incident Templates */}
            <div className="card p-5">
              <div className="section-heading mb-3">Step 2 — Incident Classification</div>
              <div className="text-xs text-[#334155] mb-3">Select a scenario template or fill the form manually.</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {INCIDENT_TEMPLATES.map((t, i) => (
                  <button key={i} type="button" onClick={() => handleTemplate(t)} className="btn-secondary text-xs py-1 px-3">
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Incident Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Severity Level</label>
                  <select className="input-field" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Incident Description <span className="text-[#B91C1C]">*</span></label>
                <textarea
                  className="input-field h-28 resize-none"
                  placeholder="Describe the emergency incident in objective detail. Include nature of hazard, number of people affected, immediate dangers, and any other relevant information..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                <div className="text-[10px] text-[#94A3B8] mt-1">Supported languages: English, Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ)</div>
              </div>

              <div className="mt-4">
                <label className="label">Estimated Persons Affected</label>
                <input
                  type="number"
                  className="input-field w-40"
                  placeholder="0"
                  min={0}
                  value={form.people_affected}
                  onChange={e => setForm(f => ({ ...f, people_affected: e.target.value }))}
                />
              </div>
            </div>

            {/* Location */}
            <div className="card p-5">
              <div className="section-heading mb-3">Step 3 — Incident Location</div>
              <div className="flex items-end gap-4">
                <div>
                  <label className="label">Latitude</label>
                  <input type="text" className="input-field w-36 font-mono" placeholder="e.g. 30.7333" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input type="text" className="input-field w-36 font-mono" placeholder="e.g. 76.7794" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} />
                </div>
                <button type="button" onClick={detectLocation} className="btn-secondary text-xs" disabled={locationLoading}>
                  {locationLoading ? 'Detecting...' : 'Detect My Location (GPS)'}
                </button>
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-2">GPS coordinates will be used to dispatch nearest response teams.</div>
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm p-3 text-sm text-[#B91C1C]">{error}</div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-[10px] text-[#94A3B8]">
                By submitting, you certify this report is accurate. False reports may be subject to legal action under Section 182 IPC.
              </div>
              <button type="submit" className="btn-primary px-8" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
