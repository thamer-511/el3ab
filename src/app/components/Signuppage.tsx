import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border-4 border-[#2D3436] bg-white p-8 shadow-[8px_8px_0px_#E08C36]">
        <h1 className="font-['Lalezar'] text-4xl text-[#E08C36] text-center mb-2">إنشاء حساب</h1>
        <p className="font-['Cairo'] text-center text-[#5F6A56] mb-6">انضم إلينا الآن!</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-['Cairo'] font-bold text-[#2D3436] mb-2 block">
              الاسم
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>

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

          <div>
            <label className="font-['Cairo'] font-bold text-[#2D3436] mb-2 block">
              تأكيد كلمة المرور
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-2 border-[#E08C36] bg-[#E08C36] py-3 font-['Lalezar'] text-xl text-[#FDF8E8] hover:bg-[#C87A2E]"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </Button>
        </form>

        <p className="mt-6 text-center font-['Cairo'] font-bold text-[#5F6A56]">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-[#6A8D56] hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
};
