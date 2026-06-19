'use client';
import {
  Page, Layout, Card, DataTable, Button, Modal, FormLayout,
  TextField, Select, Thumbnail, BlockStack, InlineStack, Badge,
  EmptyState, Banner, Text, Spinner
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Charm {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  category: string;
  engravable: boolean;
  active: boolean;
}

const CATEGORIES = [
  { label: 'Core (standard)', value: 'core' },
  { label: 'Premium', value: 'premium' },
  { label: 'Engravable', value: 'engravable' },
  { label: 'Spacer', value: 'spacer' },
];

const EMPTY_CHARM = { name: '', description: '', image: '', price: '0', category: 'core' };

function CharmsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [charms, setCharms] = useState<Charm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCharm, setEditCharm] = useState<Charm | null>(null);
  const [form, setForm] = useState(EMPTY_CHARM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/charm-library?shop=${shop}`);
    const data = await res.json();
    setCharms(data.charms || []);
    setLoading(false);
  }, [shop]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditCharm(null);
    setForm(EMPTY_CHARM);
    setModalOpen(true);
  }

  function openEdit(c: Charm) {
    setEditCharm(c);
    setForm({ name: c.name, description: c.description || '', image: c.image || '', price: String(c.price), category: c.category });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    const url = editCharm ? `/api/charm-library/${editCharm.id}?shop=${shop}` : `/api/charm-library?shop=${shop}`;
    const method = editCharm ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function deleteCharm() {
    if (!deleteId) return;
    await fetch(`/api/charm-library/${deleteId}?shop=${shop}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  }

  const categoryBadge = (cat: string) => {
    const map: any = { core: 'success', premium: 'warning', engravable: 'info', spacer: undefined };
    return <Badge tone={map[cat]}>{cat}</Badge>;
  };

  const rows = charms.map(c => [
    <InlineStack gap="300" blockAlign="center">
      <Thumbnail source={c.image || ''} alt={c.name} size="small" />
      <Text as="span" variant="bodyMd" fontWeight="semibold">{c.name}</Text>
    </InlineStack>,
    categoryBadge(c.category),
    `₹${c.price}`,
    c.engravable ? <Badge tone="info">Yes</Badge> : <Badge>No</Badge>,
    <InlineStack gap="200">
      <Button size="slim" onClick={() => openEdit(c)}>Edit</Button>
      <Button size="slim" tone="critical" onClick={() => setDeleteId(c.id)}>Delete</Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Charm Library"
      subtitle="All charms available in your store — managed here, not as Shopify products"
      primaryAction={{ content: 'Add Charm', onAction: openAdd }}
    >
      <Layout>
        <Layout.Section>
          {loading ? (
            <Card><BlockStack gap="400" align="center"><Spinner /></BlockStack></Card>
          ) : charms.length === 0 ? (
            <Card>
              <EmptyState
                heading="No charms yet"
                action={{ content: 'Add your first charm', onAction: openAdd }}
                image=""
              >
                <p>Add charms to your library. These will appear on product pages.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                headings={['Charm', 'Category', 'Price', 'Engravable', 'Actions']}
                rows={rows}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCharm ? 'Edit Charm' : 'Add New Charm'}
        primaryAction={{ content: saving ? 'Saving...' : 'Save', onAction: save, disabled: saving || !form.name }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Charm Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} autoComplete="off" />
            <TextField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} autoComplete="off" />
            <TextField label="Image URL" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} autoComplete="off" helpText="Paste full URL of the charm image" />
            {form.image && <img src={form.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />}
            <TextField label="Price (₹)" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" autoComplete="off" />
            <Select label="Category" options={CATEGORIES} value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} helpText="Engravable charms will prompt customer to enter text" />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete charm?"
        primaryAction={{ content: 'Delete', onAction: deleteCharm, destructive: true }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setDeleteId(null) }]}
      >
        <Modal.Section>
          <p>This charm will be removed from all product configurations. This cannot be undone.</p>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export default function CharmsPage() {
  return <Suspense fallback={<div>Loading...</div>}><CharmsContent /></Suspense>;
}
