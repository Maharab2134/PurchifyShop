import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";

type EmailSettingsForm = {
  mailer: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string;
  fromAddress: string;
  fromName: string;
  isActive: boolean;
};

export default function EmailSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { control, handleSubmit, reset, watch, setValue } =
    useForm<EmailSettingsForm>({
      defaultValues: {
        mailer: "smtp",
        host: "",
        port: 587,
        username: "",
        password: "",
        encryption: "tls",
        fromAddress: "",
        fromName: "",
        isActive: false,
      },
    });

  const mailer = watch("mailer");
  const [storeInfo, setStoreInfo] = useState<{
    email: string;
    storeName: string;
  } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load both email settings and store info
        const [emailSettingsRes, storeSettingsRes] = await Promise.all([
          adminApi.emailSettings.get(),
          adminApi.settings.get().catch(() => null), // Don't fail if settings can't be loaded
        ]);

        const emailData = emailSettingsRes.data.data;
        const storeInfoData = storeSettingsRes?.data?.data?.storeInfo;

        // Store store info for later use
        if (storeInfoData) {
          setStoreInfo({
            email: storeInfoData.email || "",
            storeName: storeInfoData.storeName || "",
          });
        }

        // Use store info as defaults if email settings don't have values
        const defaultFromAddress =
          emailData.fromAddress || storeInfoData?.email || "";
        const defaultFromName =
          emailData.fromName || storeInfoData?.storeName || "";

        reset({
          mailer: emailData.mailer || "smtp",
          host: emailData.host || "",
          port: emailData.port || 587,
          username: emailData.username || "",
          password:
            emailData.password === "***" ? "" : emailData.password || "",
          encryption: emailData.encryption || "tls",
          fromAddress: defaultFromAddress,
          fromName: defaultFromName,
          isActive: emailData.isActive || false,
        });
      } catch (e: any) {
        showToast(
          e?.response?.data?.message || "Failed to load email settings",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset, showToast]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await adminApi.emailSettings.update({
        mailer: data.mailer,
        host: data.mailer === "smtp" ? data.host : undefined,
        port: data.mailer === "smtp" ? data.port : undefined,
        username: data.mailer === "smtp" ? data.username : undefined,
        password: data.password || undefined,
        encryption: data.mailer === "smtp" ? data.encryption : undefined,
        fromAddress: data.fromAddress,
        fromName: data.fromName,
        isActive: data.isActive,
      });
      showToast("Email settings saved successfully", "success");
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || "Failed to save email settings",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  });

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      showToast("Please enter an email address", "error");
      return;
    }
    setTesting(true);
    try {
      await adminApi.emailSettings.testEmail({ email: testEmail.trim() });
      showToast("Test email sent successfully! Check your inbox.", "success");
      setTestEmail("");
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to send test email",
        "error",
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Email Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure SMTP settings for sending transactional emails
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Mailer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mailer Type *
            </label>
            <Controller
              name="mailer"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendmail">Sendmail</option>
                </select>
              )}
            />
          </div>

          {/* SMTP Settings - Only show if mailer is SMTP */}
          {mailer === "smtp" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Host *
                  </label>
                  <Controller
                    name="host"
                    control={control}
                    rules={{ required: mailer === "smtp" }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Port *
                  </label>
                  <Controller
                    name="port"
                    control={control}
                    rules={{ required: mailer === "smtp", min: 1, max: 65535 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="587"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Username
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Password
                  </label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="password"
                        placeholder="Leave blank to keep current"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave blank to keep current password
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Encryption
                </label>
                <Controller
                  name="encryption"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">None</option>
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                    </select>
                  )}
                />
              </div>
            </>
          )}

          {/* From Address & Name */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sender Information
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically filled from Store Settings
                </p>
              </div>
              {storeInfo && (storeInfo.email || storeInfo.storeName) && (
                <Button
                  type="button"
                  onClick={() => {
                    if (storeInfo.email) {
                      setValue("fromAddress", storeInfo.email);
                    }
                    if (storeInfo.storeName) {
                      setValue("fromName", storeInfo.storeName);
                    }
                    showToast("Filled from Store Settings", "success");
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Use Store Settings
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Email Address *
                </label>
                <Controller
                  name="fromAddress"
                  control={control}
                  rules={{
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  )}
                />
                {storeInfo?.email && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Store email: {storeInfo.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Name *
                </label>
                <Controller
                  name="fromName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Your Store Name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  )}
                />
                {storeInfo?.storeName && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Store name: {storeInfo.storeName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    {field.value ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Email Sending
                    </span>
                  </div>
                </label>
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              When enabled, emails will be sent automatically for order events
            </p>
          </div>

          {/* Test Email */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <Button
                type="button"
                onClick={handleTestEmail}
                disabled={testing || !testEmail.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Send a test email to verify your SMTP configuration
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
