import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border-4 border-[#2D3436] bg-white p-8 shadow-[8px_8px_0px_#6A8D56]">
        <h1 className="font-['Lalezar'] text-4xl text-[#6A8D56] text-center mb-2">تسجيل الدخول</h1>
        <p className="font-['Cairo'] text-center text-[#5F6A56] mb-6">مرحباً بعودتك!</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-['Cairo'] font-bold text-[#2D3436] mb-2 block">
              البريد الإلكتروني
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              dir="ltr"
            />
          </div>

          <div>
            <label className="font-['Cairo'] font-bold text-[#2D3436] mb-2 block">
              كلمة المرور
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] py-3 font-['Lalezar'] text-xl text-[#FDF8E8] hover:bg-[#5F7D4E]"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <p className="mt-6 text-center font-['Cairo'] font-bold text-[#5F6A56]">
          ليس لديك حساب؟{' '}
          <Link to="/signup" className="text-[#E08C36] hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </main>
  );
};
