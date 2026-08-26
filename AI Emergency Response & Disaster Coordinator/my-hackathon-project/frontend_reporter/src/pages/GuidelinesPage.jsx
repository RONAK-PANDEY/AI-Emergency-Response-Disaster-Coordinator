import React from 'react';

export default function GuidelinesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Reporting Guidelines</h1>
        <p className="text-sm text-[#334155] mt-1">Standard Operating Procedure for Emergency Incident Filing — Government of Punjab SEOC</p>
      </div>

      <div className="card p-5 border-l-4 border-[#003366]">
        <div className="section-heading mb-3">When to File a Report</div>
        <ul className="space-y-2 text-sm text-[#334155]">
          <li className="flex gap-2"><span className="text-[#003366] font-bold shrink-0">•</span><span>You have directly witnessed or been affected by an emergency event.</span></li>
          <li className="flex gap-2"><span className="text-[#003366] font-bold shrink-0">•</span><span>The situation requires intervention by police, fire brigade, ambulance, or disaster response teams.</span></li>
          <li className="flex gap-2"><span className="text-[#003366] font-bold shrink-0">•</span><span>You have credible, first-hand information about an ongoing or developing hazard.</span></li>
        </ul>
      </div>

      <div className="card p-5">
        <div className="section-heading mb-3">Incident Severity Classification</div>
        <div className="space-y-3">
          {[
            { level: 'Critical', css: 'severity-critical', desc: 'Immediate life threat, multiple casualties, fire/flood actively spreading. Response target: <15 minutes.' },
            { level: 'High', css: 'severity-high', desc: 'Serious hazard, risk of escalation, injuries present. Response target: <30 minutes.' },
            { level: 'Medium', css: 'severity-medium', desc: 'Contained situation, risk of injury if unaddressed. Response target: <60 minutes.' },
            { level: 'Low', css: 'severity-low', desc: 'Preventive action required, no immediate danger. Response target: <4 hours.' },
          ].map(s => (
            <div key={s.level} className="flex gap-3 items-start">
              <span className={`mt-0.5 inline-block px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${s.css}`}>{s.level}</span>
              <span className="text-sm text-[#334155]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="section-heading mb-3">What Happens After You File</div>
        <div className="space-y-3">
          {[
            { step: '1', label: 'AI Triage', desc: 'Your report is analyzed by the SEOC Autonomous NLP Triage Engine to classify severity and incident type.' },
            { step: '2', label: 'Officer Review', desc: 'A designated SEOC officer reviews and validates the classification within the response time window.' },
            { step: '3', label: 'Dispatch', desc: 'Response teams (Police, Fire, SDRF, Medical) are dispatched to the reported coordinates.' },
            { step: '4', label: 'Resolution', desc: 'Incident is formally closed and recorded in the State Disaster Registry upon resolution.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3 items-start">
              <div className="w-6 h-6 bg-[#003366] text-white text-xs font-bold rounded-sm flex items-center justify-center shrink-0">{s.step}</div>
              <div>
                <div className="text-sm font-semibold text-[#0F172A]">{s.label}</div>
                <div className="text-xs text-[#334155] mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm p-4">
        <div className="text-sm font-semibold text-[#B91C1C] mb-1">Legal Notice — False Reporting</div>
        <div className="text-xs text-[#334155]">
          Filing a false or misleading emergency report is a criminal offence under Section 182 of the Indian Penal Code and Section 51 of the Disaster Management Act, 2005. Offenders may face imprisonment up to 6 months or a fine, or both. All Aadhaar-verified reports are traceable.
        </div>
      </div>

      <div className="card p-4 text-center">
        <div className="text-xs text-[#94A3B8]">
          For life-threatening emergencies, always call <strong>112</strong> first before filing a report.
        </div>
      </div>
    </div>
  );
}
