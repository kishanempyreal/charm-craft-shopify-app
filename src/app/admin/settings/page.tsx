'use client';
import {
  Page, Layout, Card, Text, BlockStack, InlineStack, Badge,
  Button, TextField, Select, RangeSlider, Checkbox, Banner, Toast, Frame
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Settings {
  configuratorTitle: string;
  maxCharms: number;
  enablingEngraving: boolean;
  currencyCode: string;
  customCss: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [settings, setSettings] = useState<Settings>({
    configuratorTitle: 'Build Your Necklace',
    maxCharms: 8,
    enablingEngraving: true,
    currencyCode: 'INR',
    customCss: '',
  });
  const [saving, setSaving] = useState(false);
  const [toastActive, setToastActive] = useState(false);

  useEffect(() => {
    fetch(`/api/settings?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => { if (data.settings) setSettings(data.settings); })
      .catch(() => {});
  }, [shop]);

  const save = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop, ...settings }),
    });
    setSaving(false);
    setToastActive(true);
  };

  const toastMarkup = toastActive ? (
    <Toast content="Settings saved!" onDismiss={() => setToastActive(false)} />
  ) : null;

  return (
    <Frame>
      <Page
        title="App Settings"
        primaryAction={{ content: saving ? 'Saving...' : 'Save Settings', onAction: save, loading: saving }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Configurator Settings</Text>
                <TextField
                  label="Configurator Page Title"
                  value={settings.configuratorTitle}
                  onChange={v => setSettings(s => ({ ...s, configuratorTitle: v }))}
                  autoComplete="off"
                  helpText="Shown at the top of the Build Your Necklace page"
                />
                <RangeSlider
                  label={`Maximum Charms per Necklace: ${settings.maxCharms}`}
                  min={3}
                  max={12}
                  value={settings.maxCharms}
                  onChange={v => setSettings(s => ({ ...s, maxCharms: v as number }))}
                />
                <Checkbox
                  label="Enable Engraving Option"
                  checked={settings.enablingEngraving}
                  onChange={v => setSettings(s => ({ ...s, enablingEngraving: v }))}
                  helpText="Allow customers to add custom text to engravable charms"
                />
                <Select
                  label="Currency"
                  options={[
                    { label: 'Indian Rupee (₹ INR)', value: 'INR' },
                    { label: 'US Dollar ($ USD)', value: 'USD' },
                    { label: 'Euro (€ EUR)', value: 'EUR' },
                    { label: 'British Pound (£ GBP)', value: 'GBP' },
                  ]}
                  value={settings.currencyCode}
                  onChange={v => setSettings(s => ({ ...s, currencyCode: v }))}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Custom CSS</Text>
                <TextField
                  label="Custom CSS (optional)"
                  multiline={6}
                  value={settings.customCss}
                  onChange={v => setSettings(s => ({ ...s, customCss: v }))}
                  autoComplete="off"
                  helpText="Add custom styles to override the configurator appearance"
                  monospaced
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Store Connection</Text>
                <InlineStack gap="200">
                  <Badge tone="success">Connected</Badge>
                  <Text as="span">{shop}</Text>
                </InlineStack>
                <Button
                  url={`https://${shop}/pages/build-your-necklace`}
                  external
                >
                  Open Configurator on Store
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        {toastMarkup}
      </Page>
    </Frame>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
