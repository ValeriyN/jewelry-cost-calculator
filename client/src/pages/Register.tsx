import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.register(email, password);
      login(data.token, data.user);
      navigate("/components");
    } catch (err: any) {
      setError(err.response?.data?.error ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-surface-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h12l4 6-10 13L2 9Z"></path><path d="M11 3 8 9l4 13 4-13-3-6"></path><path d="M2 9h20"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">{t("auth.register")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            placeholder={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            placeholder={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            hint="Мінімум 6 символів"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("auth.registerBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-surface-400">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-primary-400 font-medium hover:text-primary-300">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
