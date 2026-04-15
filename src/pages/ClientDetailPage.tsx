import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { clientApi } from '../services/api';
import { Select, TextInput } from '../components/common/FormField';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';
import type { Client } from '../types';

type PaymentTerms = 'NET_0' | 'NET_30' | 'NET_60' | 'NET_90';

interface EditForm {
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    region: string;
  };
}

const ClientDetailPage = () => {
  const { t } = useTranslation();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    email: '',
    phone: '',
    address: { street: '', city: '', postalCode: '', country: '', region: '' },
  });

  // Payment terms state
  const [updatingTerms, setUpdatingTerms] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const clientData = await clientApi.getById(clientId);
        setClient(clientData);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError(err instanceof Error ? err.message : t('clientDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleEditOpen = () => {
    if (!client) return;
    setEditForm({
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: {
        street: (client as any).address?.street ?? '',
        city: (client as any).address?.city ?? client.city ?? '',
        postalCode: (client as any).address?.postalCode ?? '',
        country: (client as any).address?.country ?? '',
        region: (client as any).address?.region ?? '',
      },
    });
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleEditSave = async () => {
    if (!clientId) return;
    try {
      setSaving(true);
      const updated = await clientApi.update(clientId, {
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
      });
      setClient(updated);
      setEditing(false);
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error(err instanceof Error ? err.message : t('toast.error.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentTermsChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!clientId) return;
    const terms = e.target.value as PaymentTerms;
    try {
      setUpdatingTerms(true);
      const updated = await clientApi.updatePaymentTerms(clientId, terms);
      setClient(updated);
    } catch (err) {
      console.error('Error updating payment terms:', err);
      toast.error(err instanceof Error ? err.message : t('toast.error.saveError'));
    } finally {
      setUpdatingTerms(false);
    }
  };

  const runDeleteClient = async () => {
    if (!clientId || !client) return;
    try {
      setDeleting(true);
      await clientApi.delete(clientId);
      toast.success(t('toast.success.clientDeleted'));
      setConfirmDelete(false);
      navigate('/manager/clients');
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error(err instanceof Error ? err.message : t('toast.error.generic'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div >
        <p className="text-center text-red-600">{error || t('clientDetail.notFound')}</p>
        <button
          onClick={() => navigate('/manager/clients')}
          className="mt-4 mx-auto block px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const clientPaymentTerms: PaymentTerms = (client as any).paymentTerms ?? 'NET_30';

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/manager/clients')}
          className="text-2xl text-gray-600 hover:text-gray-900 transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{t('clientDetail.clients')}</p>
          <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
        </div>
        <button
          onClick={handleEditOpen}
          className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('common.edit')}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? t('clientDetail.deleting') : t('clientDetail.delete')}
        </button>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('clientDetail.clientInfo')}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('clientDetail.taxId')}</span>
            <span className="text-sm font-medium text-gray-900">{client.taxId || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('clientDetail.email')}</span>
            <span className="text-sm font-medium text-gray-900">{client.email || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('clientDetail.phone')}</span>
            <span className="text-sm font-medium text-gray-900">{client.phone || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('clientDetail.city')}</span>
            <span className="text-sm font-medium text-gray-900">{client.city || '-'}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('clientDetail.paymentTerms')}</h2>
        <Select
          value={clientPaymentTerms}
          onChange={handlePaymentTermsChange}
          disabled={updatingTerms}
        >
          <option value="NET_0">{t('paymentTerms.NET_0')}</option>
          <option value="NET_30">{t('paymentTerms.NET_30')}</option>
          <option value="NET_60">{t('paymentTerms.NET_60')}</option>
          <option value="NET_90">{t('paymentTerms.NET_90')}</option>
        </Select>
        {updatingTerms && (
          <p className="text-xs text-gray-500 mt-1">{t('clientDetail.updating')}</p>
        )}
      </div>

      {/* Inline Edit Form */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={handleEditCancel}>
          <div
            className="bg-white rounded-t-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('clientDetail.clientDetail')}</h2>

            <div className="space-y-4">
              <TextInput
                label={t('clientDetail.email')}
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ornek@sirket.com"
              />

              <TextInput
                label={t('clientDetail.phone')}
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+90 5xx xxx xx xx"
              />

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('clientDetail.address')}</p>
                <div className="space-y-3">
                  <TextInput
                    label={t('clientDetail.street')}
                    type="text"
                    value={editForm.address.street}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: { ...f.address, street: e.target.value } }))
                    }
                    placeholder={t('clientDetail.placeholderStreet')}
                  />
                  <TextInput
                    label={t('clientDetail.city')}
                    type="text"
                    value={editForm.address.city}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))
                    }
                    placeholder={t('clientDetail.placeholderCity')}
                  />
                  <TextInput
                    label={t('clientDetail.postalCode')}
                    type="text"
                    value={editForm.address.postalCode}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: { ...f.address, postalCode: e.target.value } }))
                    }
                    placeholder={t('clientDetail.placeholderPostalCode')}
                  />
                  <TextInput
                    label={t('clientDetail.region')}
                    type="text"
                    value={editForm.address.region}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: { ...f.address, region: e.target.value } }))
                    }
                    placeholder={t('clientDetail.placeholderRegion')}
                  />
                  <TextInput
                    label={t('clientDetail.country')}
                    type="text"
                    value={editForm.address.country}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: { ...f.address, country: e.target.value } }))
                    }
                    placeholder={t('clientDetail.placeholderCountry')}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? t('clientDetail.saving') : t('clientDetail.save')}
              </button>
              <button
                onClick={handleEditCancel}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && client && (
        <ConfirmActionModal
          title={t('confirmDelete.client.title')}
          description={t('confirmDelete.client.description', { name: client.companyName })}
          bullets={[t('common.irreversible')]}
          confirmLabel={t('common.delete')}
          tone="danger"
          onConfirm={runDeleteClient}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default ClientDetailPage;
