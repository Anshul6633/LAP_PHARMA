import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { experimentService } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, BeakerIcon, CheckBadgeIcon, ClockIcon, WrenchScrewdriverIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Section = ({ title, icon: Icon, children, color = 'text-primary-600 bg-primary-50' }) => (
  <div className="card">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const ExperimentDetailPage = () => {
  const { id } = useParams();
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experimentService.getById(id)
      .then(({ data }) => setExp(data.experiment))
      .catch(() => toast.error('Failed to load experiment'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!exp) return <div className="text-center py-12 text-gray-500">Experiment not found</div>;

  const diffColors = { easy: 'badge-green', medium: 'badge-yellow', hard: 'badge-red' };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/experiments" className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
        <div>
          <h1 className="page-title">{exp.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {exp.experimentNo && <span className="badge badge-blue">{exp.experimentNo}</span>}
            {exp.category && <span className="badge badge-purple">{exp.category}</span>}
            <span className={`badge ${diffColors[exp.difficulty]}`}>{exp.difficulty}</span>
            <span className="badge badge-gray flex items-center gap-1"><ClockIcon className="w-3 h-3" />{exp.duration}h</span>
            {exp.isApproved && <span className="badge badge-green flex items-center gap-1"><CheckBadgeIcon className="w-3 h-3" />Approved</span>}
          </div>
        </div>
      </div>

      {/* Objective */}
      <div className="card bg-primary-50 border-primary-100">
        <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">Objective / Aim</div>
        <p className="text-gray-800">{exp.objective}</p>
      </div>

      {/* Theory */}
      {exp.theory && (
        <Section title="Theory" icon={DocumentTextIcon} color="text-indigo-600 bg-indigo-50">
          <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{exp.theory}</p>
        </Section>
      )}

      {/* Chemicals + Apparatus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Required Chemicals" icon={BeakerIcon} color="text-orange-600 bg-orange-50">
          {exp.requiredChemicals?.length > 0 ? (
            <div className="space-y-1.5">
              {exp.requiredChemicals.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.name}</span>
                  <span className="badge badge-gray">{c.quantity} {c.unit}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No chemicals listed</p>}
        </Section>

        <Section title="Apparatus Required" icon={WrenchScrewdriverIcon} color="text-pharma-600 bg-pharma-50">
          {exp.apparatus?.length > 0 ? (
            <div className="space-y-1.5">
              {exp.apparatus.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{a.name}</span>
                  <span className="badge badge-gray">×{a.quantity}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No apparatus listed</p>}
        </Section>
      </div>

      {/* Solutions */}
      {exp.solutions?.length > 0 && (
        <Section title="Required Solutions" icon={BeakerIcon} color="text-blue-600 bg-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exp.solutions.map(s => (
              <div key={s._id} className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center"><BeakerIcon className="w-4 h-4 text-blue-700" /></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.concentration} {s.formula}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Procedure */}
      <Section title="Procedure" icon={DocumentTextIcon} color="text-green-600 bg-green-50">
        <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{exp.procedure}</p>
      </Section>

      {/* Observations & Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exp.observations && (
          <Section title="Observations" icon={DocumentTextIcon} color="text-yellow-600 bg-yellow-50">
            <p className="text-gray-700 text-sm whitespace-pre-line">{exp.observations}</p>
          </Section>
        )}
        {exp.result && (
          <Section title="Result / Formula" icon={DocumentTextIcon} color="text-purple-600 bg-purple-50">
            <p className="text-gray-700 text-sm whitespace-pre-line font-mono">{exp.result}</p>
          </Section>
        )}
      </div>

      {/* Precautions */}
      {exp.precautions && (
        <div className="card bg-red-50 border-red-100">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">⚠ Precautions</div>
          <p className="text-gray-700 text-sm whitespace-pre-line">{exp.precautions}</p>
        </div>
      )}

      {/* Viva Questions */}
      {exp.viva?.length > 0 && (
        <Section title="Viva Questions" icon={DocumentTextIcon} color="text-indigo-600 bg-indigo-50">
          <div className="space-y-3">
            {exp.viva.map((v, i) => (
              <div key={i} className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="text-sm font-medium text-indigo-800">Q{i+1}. {v.question}</div>
                {v.answer && <div className="text-sm text-gray-600 mt-1">A: {v.answer}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tags */}
      {exp.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {exp.tags.map(t => <span key={t} className="badge badge-gray">#{t}</span>)}
        </div>
      )}
    </div>
  );
};

export default ExperimentDetailPage;
