import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services";
import { showToast } from "@/utils/toast";

interface OrangeSmsConfig {
  clientId: string;
  clientSecret: string;
  senderAddress: string;
  senderName: string;
  countryCode: string;
}

const OrangeSmsSettings: React.FC = () => {
  const [form, setForm] = useState<OrangeSmsConfig>({
    clientId: "",
    clientSecret: "",
    senderAddress: "",
    senderName: "",
    countryCode: "224",
  });
  const [hasSecret, setHasSecret] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testForm, setTestForm] = useState({
    phoneNumber: "",
    message: "Absence SMS test message",
    senderName: "",
  });
  const [useFormCredentials, setUseFormCredentials] = useState(false);
  const [lastTestMeta, setLastTestMeta] = useState<null | {
    status: string;
    resourceId?: string;
    error?: string;
    metadata?: {
      usedOverride: boolean;
      clientIdPreview: string;
      authHeaderPreview: string;
    };
  }>(null);

  useEffect(() => {
    void loadConfig();
  }, []);

  const loadConfig = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const response = await apiService.superadmin.getOrangeSmsConfig();
      if (response.data.success && response.data.data?.hasCredentials) {
        const data = response.data.data;
        setForm((prev) => ({
          ...prev,
          clientId: data.clientId || "",
          clientSecret: "",
          senderAddress: data.senderAddress || "",
          senderName: data.senderName || "",
          countryCode: data.countryCode || prev.countryCode,
        }));
        setHasSecret(Boolean(data.hasClientSecret));
        if (data.lastUpdatedAt) {
          setLastUpdated(new Date(data.lastUpdatedAt).toLocaleString());
        }
        if (data.lastUpdatedBy) {
          setLastUpdatedBy(data.lastUpdatedBy.name || "");
        }
      }
    } catch (error) {
      console.error("Failed to load Orange SMS config", error);
      showToast.error("Unable to load Orange SMS configuration.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const handleChange = (field: keyof OrangeSmsConfig, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const payload: Record<string, string> = {};

    if (form.clientId.trim()) {
      payload.clientId = form.clientId.trim();
    }
    if (form.clientSecret.trim()) {
      payload.clientSecret = form.clientSecret.trim();
    }
    if (form.senderAddress.trim()) {
      payload.senderAddress = form.senderAddress.trim();
    }
    if (form.senderName.trim()) {
      payload.senderName = form.senderName.trim();
    }
    if (form.countryCode.trim()) {
      payload.countryCode = form.countryCode.trim();
    }

    if (Object.keys(payload).length === 0) {
      showToast.warning("Please update at least one field before saving.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.superadmin.updateOrangeSmsConfig(
        payload as any
      );
      if (response.data.success) {
        showToast.success("Orange SMS configuration updated successfully.");
        await loadConfig({ silent: true });
      } else {
        showToast.error(response.data.message || "Failed to update Orange SMS settings.");
      }
    } catch (error: any) {
      console.error("Failed to update Orange SMS config", error);
      const message =
        error?.response?.data?.message ||
        "Unable to update configuration. Please retry.";
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async () => {
    if (!testForm.phoneNumber.trim()) {
      showToast.warning("Please provide a phone number with country code.");
      return;
    }

    if (!testForm.message.trim()) {
      showToast.warning("Message cannot be empty.");
      return;
    }

    try {
      setSendingTest(true);
      const payload: any = {
        phoneNumber: testForm.phoneNumber.trim(),
        message: testForm.message.trim(),
        senderName: testForm.senderName.trim() || undefined,
      };

      if (useFormCredentials) {
        if (!form.clientId.trim() || !form.clientSecret.trim()) {
          showToast.warning(
            "Provide both client ID and client secret to test with custom credentials."
          );
          setSendingTest(false);
          return;
        }
        payload.clientId = form.clientId.trim();
        payload.clientSecret = form.clientSecret.trim();
      }

      const response = await apiService.superadmin.sendOrangeSmsTest(payload);

      const result = response.data.data;
      setLastTestMeta(result || null);

      if (response.data.success && result?.status === "sent") {
        showToast.success("Test SMS sent successfully.");
      } else {
        showToast.error(result?.error || "Failed to send test SMS.");
      }
    } catch (error: any) {
      console.error("Failed to send test SMS", error);
      const message =
        error?.response?.data?.message || "Unable to send test SMS.";
      showToast.error(message);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orange SMS Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700">
          <p>
            Configure the shared Orange SMS credentials that will be used for
            sending automated absence alerts to parents. Updating the client
            secret will immediately rotate the credential used by all schools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <Input
                value={form.clientId}
                onChange={(event) => handleChange("clientId", event.target.value)}
                placeholder="Orange developer client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <Input
                type="password"
                value={form.clientSecret}
                onChange={(event) => handleChange("clientSecret", event.target.value)}
                placeholder={hasSecret ? "••••••••" : "Set client secret"}
              />
              {hasSecret && (
                <p className="text-xs text-gray-500 mt-1">
                  A client secret is already configured. For security it is not displayed here; enter a new value to rotate it.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender Address (MSISDN)
              </label>
              <Input
                value={form.senderAddress}
                onChange={(event) => handleChange("senderAddress", event.target.value)}
                placeholder="e.g., +2240000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender Name (optional)
              </label>
              <Input
                value={form.senderName}
                onChange={(event) => handleChange("senderName", event.target.value)}
                placeholder="Custom sender name"
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                Orange allows up to 11 alphanumeric characters for approved
                sender names.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Country Code
              </label>
              <Input
                value={form.countryCode}
                onChange={(event) => handleChange("countryCode", event.target.value)}
                placeholder="224"
              />
            </div>
          </div>

          {(lastUpdated || lastUpdatedBy) && (
            <div className="text-sm text-gray-600">
              <p>
                Last updated {lastUpdated && `on ${lastUpdated}`} {lastUpdatedBy && `by ${lastUpdatedBy}`}
              </p>
            </div>
          )}

      <div>
        <Button onClick={() => void handleSave()} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </CardContent>
  </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Test SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Send a one-off message to verify that the shared Orange credentials are working as expected.
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useFormCredentials}
              onChange={(event) => setUseFormCredentials(event.target.checked)}
            />
            Use current Client ID / Secret for this test (bypasses saved credentials)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number (with country code)
              </label>
              <Input
                value={testForm.phoneNumber}
                onChange={(event) =>
                  setTestForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                }
                placeholder="e.g., +224628686315"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender name (optional)
              </label>
              <Input
                value={testForm.senderName}
                maxLength={11}
                onChange={(event) =>
                  setTestForm((prev) => ({ ...prev, senderName: event.target.value }))
                }
                placeholder="Custom sender"
              />
            </div>
          </div>
          {useFormCredentials && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <Input
                  value={form.clientId}
                  onChange={(event) => handleChange("clientId", event.target.value)}
                  placeholder="Orange developer client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <Input
                  type="password"
                  value={form.clientSecret}
                  onChange={(event) => handleChange("clientSecret", event.target.value)}
                  placeholder="Current client secret"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring focus:border-blue-300"
              rows={4}
              value={testForm.message}
              onChange={(event) =>
                setTestForm((prev) => ({ ...prev, message: event.target.value }))
              }
            />
          </div>
          <Button onClick={handleTestSend} disabled={sendingTest}>
            {sendingTest ? "Sending..." : "Send Test SMS"}
          </Button>
          {lastTestMeta && (
            <div className="text-sm text-gray-700 space-y-1 bg-gray-50 border border-gray-200 p-3 rounded-md">
              <div>
                <span className="font-semibold">Status:</span> {lastTestMeta.status}
              </div>
              {lastTestMeta.resourceId && (
                <div>
                  <span className="font-semibold">Resource ID:</span> {lastTestMeta.resourceId}
                </div>
              )}
              {lastTestMeta.error && (
                <div className="text-red-600">
                  <span className="font-semibold">Error:</span> {lastTestMeta.error}
                </div>
              )}
              {lastTestMeta.metadata && (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div>
                    Override credentials used: {lastTestMeta.metadata.usedOverride ? "Yes" : "No"}
                  </div>
                  <div>Client ID preview: {lastTestMeta.metadata.clientIdPreview}</div>
                  <div>Basic header preview: {lastTestMeta.metadata.authHeaderPreview}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrangeSmsSettings;
