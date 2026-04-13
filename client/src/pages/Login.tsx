import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
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
      const data = await authApi.login(email, password);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Калькулятор вартості</h1>
          <p className="text-sm text-surface-400">Ювелірні вироби</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("auth.loginBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-surface-400">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-primary-400 font-medium hover:text-primary-300">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
