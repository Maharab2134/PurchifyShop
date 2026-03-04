import { useState, useCallback, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Store, CheckCircle, MapPin } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import Button from "@/components/atoms/Button";
import axiosInstance from "@/utils/axiosInstance";
import useToast from "@/hooks/useToast";

type FormValues = {
  name: string;
  email: string;
  address: string;
  whatsappNumber: string;
  contactName: string;
};

export default function ApplyVendor() {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const addressAutoFilledOnce = useRef(false);

  const { control, handleSubmit, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      address: "",
      whatsappNumber: "",
      contactName: "",
    },
  });

  const clearPage = useCallback(() => {
    reset({
      name: "",
      email: "",
      address: "",
      whatsappNumber: "",
      contactName: "",
    });
    setSubmitted(false);
    addressAutoFilledOnce.current = false;
  }, [reset]);

  useEffect(() => {
    clearPage();
  }, [clearPage]);

  const fillCurrentAddress = useCallback(async () => {
    if (!navigator.geolocation) {
      showToast("Location not supported by your browser", "error");
      return;
    }
    setFetchingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );
      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "EcommerceVendorApp/1.0",
          },
        },
      );
      const data = await res.json();
      const address = data?.display_name ?? `${latitude}, ${longitude}`;
      setValue("address", address);
      showToast("Address filled from your location", "success");
    } catch (e) {
      if ((e as { code?: number })?.code === 1) {
        showToast("Location permission denied", "error");
      } else {
        showToast("Could not get location", "error");
      }
    } finally {
      setFetchingLocation(false);
    }
  }, [setValue, showToast]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await axiosInstance.post("/vendor-applications", {
        name: data.name.trim(),
        email: data.email.trim(),
        address: data.address?.trim() || undefined,
        whatsapp_number: data.whatsappNumber?.trim() || undefined,
        contact_name: data.contactName?.trim() || undefined,
      });
      setSubmitted(true);
      showToast(
        "Application submitted. We will review and contact you soon.",
        "success",
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to submit";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });

  if (submitted) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Application Submitted
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for applying. We will review your application and
              contact you at the email you provided.
            </p>
            <Button
              type="button"
              onClick={clearPage}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Submit another application
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Store className="text-indigo-600 dark:text-indigo-400" size={24} />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Apply for Vendors
            </h1>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Fill in the form below. After review, we will contact you at the
              email you provide.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business name *
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Required" }}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      {...field}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${fieldState.error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                      placeholder="Your business name"
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                }}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      {...field}
                      type="email"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${fieldState.error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                      placeholder="vendor@example.com"
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact name
              </label>
              <Controller
                name="contactName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Your name"
                  />
                )}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <button
                  type="button"
                  onClick={fillCurrentAddress}
                  disabled={fetchingLocation}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50"
                >
                  <MapPin size={14} />
                  {fetchingLocation
                    ? "Getting location..."
                    : "Use current location"}
                </button>
              </div>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    onFocus={() => {
                      if (
                        !field.value?.trim() &&
                        !fetchingLocation &&
                        !addressAutoFilledOnce.current
                      ) {
                        addressAutoFilledOnce.current = true;
                        fillCurrentAddress();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Business address (focus to auto-fill from location)"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp number
              </label>
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="+8801000000000"
                  />
                )}
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
