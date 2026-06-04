"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FormConfig } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import { Loader2, Save, ChevronLeft } from 'lucide-react';
import { cn } from './SidebarRenderer';

interface DynamicFormProps {
  config: FormConfig;
  appId: string;
  appDefinition: AppDefinition;
  recordId?: string; // if provided, load existing record for edit
}

async function fetchRecord(appId: string, entitySlug: string, recordId: string) {
  const res = await fetch(`/api/apps/${appId}/${entitySlug}/${recordId}`);
  if (!res.ok) throw new Error('Failed to load record');
  return res.json();
}

async function fetchRelatedRecords(appId: string, entitySlug: string) {
  const res = await fetch(`/api/apps/${appId}/${entitySlug}?limit=100`);
  if (!res.ok) throw new Error('Failed to load related records');
  return res.json();
}

export default function DynamicForm({ config, appId, appDefinition, recordId }: DynamicFormProps) {
  const router = useRouter();
  const entity = appDefinition.entities.find(e => e.id === config.entityId);
  const entitySlug = entity?.name.toLowerCase() + 's';

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing record data for edit mode
  const { data: existingRecord, isLoading: loadingRecord } = useQuery({
    queryKey: ['record', appId, config.entityId, recordId],
    queryFn: () => fetchRecord(appId, entitySlug!, recordId!),
    enabled: config.mode === 'edit' && !!recordId && !!entity,
  });

  useEffect(() => {
    if (existingRecord?.data) {
      setFormData(existingRecord.data.data || existingRecord.data || {});
    }
  }, [existingRecord]);

  // Pre-fetch related entity lists for relation dropdowns
  const relationFields = config.fields.filter(f => f.controlType === 'select' && getFieldDef(f.fieldId)?.type === 'relation');

  function getFieldDef(fieldId: string) {
    return entity?.fields.find(f => f.id === fieldId);
  }

  // Map: entityId -> records
  const relatedQueries: Record<string, any> = {};
  const relatedEntityIds = Array.from(new Set(
    relationFields.map(f => getFieldDef(f.fieldId)?.relation?.entityId).filter(Boolean) as string[]
  ));

  // We'll use a simple approach: individual useQuery per relation entity
  // Since we can't call hooks in a loop conditionally, we'll pass them as an array
  const RelationSelect = ({ fieldId }: { fieldId: string }) => {
    const fieldDef = getFieldDef(fieldId);
    const relEntityId = fieldDef?.relation?.entityId;
    const relEntity = appDefinition.entities.find(e => e.id === relEntityId);
    const relEntitySlug = relEntity?.name.toLowerCase() + 's';

    const { data, isLoading } = useQuery({
      queryKey: ['related', appId, relEntityId],
      queryFn: () => fetchRelatedRecords(appId, relEntitySlug!),
      enabled: !!relEntity,
    });

    const options: any[] = data?.data || [];
    const labelField = relEntity?.fields.find(f => f.type === 'string' && f.name.toLowerCase().includes('name'));
    const getLabel = (rec: any) => {
      if (labelField) return rec.data?.[labelField.id] || rec.id;
      const firstStr = relEntity?.fields.find(f => f.type === 'string');
      return firstStr ? rec.data?.[firstStr.id] || rec.id : rec.id;
    };

    return (
      <select
        id={fieldId}
        value={formData[fieldId] || ''}
        onChange={e => setFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
        className={cn(
          "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
          errors[fieldId] ? "border-red-400" : "border-gray-300"
        )}
      >
        <option value="">— Select {relEntity?.name} —</option>
        {isLoading && <option disabled>Loading...</option>}
        {options.map((rec: any) => (
          <option key={rec.id} value={rec.id}>{getLabel(rec)}</option>
        ))}
      </select>
    );
  };

  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const url = config.mode === 'edit' && recordId
        ? `/api/apps/${appId}/${entitySlug}/${recordId}`
        : `/api/apps/${appId}/${entitySlug}`;
      const method = config.mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Submission failed');
      return json;
    },
    onSuccess: () => {
      router.push(`/apps/${appId}/${entitySlug}`);
      router.refresh();
    }
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach(f => {
      if (f.required && !formData[f.fieldId]) {
        const fieldDef = getFieldDef(f.fieldId);
        newErrors[f.fieldId] = `${fieldDef?.name || f.fieldId} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate(formData);
  };

  const renderField = (field: FormConfig['fields'][0]) => {
    const fieldDef = getFieldDef(field.fieldId);
    if (!fieldDef) return null;

    const label = fieldDef.name;
    const value = formData[field.fieldId] ?? '';
    const error = errors[field.fieldId];

    const inputClass = cn(
      "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow",
      error ? "border-red-400 ring-red-200" : "border-gray-300"
    );

    let input: React.ReactNode;

    switch (field.controlType) {
      case 'select':
        if (fieldDef.type === 'relation') {
          input = <RelationSelect fieldId={field.fieldId} />;
        } else {
          // enum
          input = (
            <select
              id={field.fieldId}
              value={value}
              onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
              className={inputClass}
            >
              <option value="">— Select —</option>
              {fieldDef.enumValues?.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          );
        }
        break;
      case 'checkbox':
        input = (
          <div className="flex items-center gap-2">
            <input
              id={field.fieldId}
              type="checkbox"
              checked={!!value}
              onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={field.fieldId} className="text-sm text-gray-600">{label}</label>
          </div>
        );
        return (
          <div key={field.fieldId} className="flex flex-col gap-1">
            {input}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      case 'textarea':
        input = (
          <textarea
            id={field.fieldId}
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
            rows={3}
            className={inputClass}
          />
        );
        break;
      case 'number':
        input = (
          <input
            id={field.fieldId}
            type="number"
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: Number(e.target.value) }))}
            className={inputClass}
          />
        );
        break;
      case 'date':
        input = (
          <input
            id={field.fieldId}
            type={fieldDef.type === 'datetime' ? 'datetime-local' : 'date'}
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
            className={inputClass}
          />
        );
        break;
      default:
        input = (
          <input
            id={field.fieldId}
            type={fieldDef.type === 'email' ? 'email' : fieldDef.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
            className={inputClass}
          />
        );
    }

    return (
      <div key={field.fieldId} className="flex flex-col gap-1.5">
        <label htmlFor={field.fieldId} className="text-sm font-medium text-gray-700">
          {label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {input}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  if (!entity) {
    return <div className="p-4 bg-yellow-50 text-yellow-700 rounded">Entity not found: {config.entityId}</div>;
  }

  if (config.mode === 'edit' && loadingRecord) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading record...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-sm text-gray-500">Fill in the fields below to {config.mode} a {entity.name}.</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {config.fields.map(f => renderField(f))}
        </div>

        {submitMutation.isError && (
          <div className="mx-6 mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {(submitMutation.error as Error)?.message || 'An error occurred.'}
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {config.mode === 'edit' ? 'Save Changes' : `Create ${entity.name}`}
          </button>
        </div>
      </form>
    </div>
  );
}
