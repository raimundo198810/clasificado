import React, { useState } from "react";
import { X, Mail, Lock, User, Phone, LogIn, AlertCircle } from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName) {
          setError("Por favor, preencha o seu nome completo.");
          setLoading(false);
          return;
        }
        // Register User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        // Save phone to localStorage as a fallback profile state
        if (phone) {
          localStorage.setItem(`viva_phone_${userCredential.user.uid}`, phone);
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está sendo utilizado.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve conter pelo menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de e-mail inválido.");
      } else {
        setError(err.message || "Ocorreu um erro ao fazer login.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepopulate test admin values
  const handleQuickLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const demoEmail = `testuser_${Math.floor(Math.random() * 10000)}@viva.com`;
      const demoPass = "vivalocal123";
      const demoName = "João Silva (Demonstração)";
      
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
      await updateProfile(userCredential.user, {
        displayName: demoName
      });
      localStorage.setItem(`viva_phone_${userCredential.user.uid}`, "(11) 99999-8888");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.log("Creating/Logging with temporary accounts", err);
      // Fallback signing in a static demo if random register fails due to unforeseen reasons
      try {
        await signInWithEmailAndPassword(auth, "silva.test@viva.com", "vivalocal123");
        onSuccess();
        onClose();
      } catch (innerErr: any) {
        setError("Não foi possível criar conta temporária automática. Por favor digite qualquer login/senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs" id="viva-auth-modal">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isRegister ? "Criar conta no VivaLocal" : "Acesse sua conta"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isRegister ? "Publique e gerencie anúncios locais rápido" : "Converse com vendedores e gerencie seus chats"}
            </p>
          </div>
          <button 
            id="viva-auth-close"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <>
              {/* Name field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/20"
                    id="viva-auth-name"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Telefone de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/20"
                    id="viva-auth-phone"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Ex: joao@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/20"
                id="viva-auth-email"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min. 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/20"
                id="viva-auth-password"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            id="viva-auth-submit"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? "Processando..." : isRegister ? "Cadastrar" : "Entrar na Conta"}</span>
          </button>

          {/* Separator */}
          <div className="flex items-center justify-between text-xs text-gray-400 my-4">
            <span className="h-[1px] bg-gray-150 flex-1"></span>
            <span className="px-3 uppercase font-semibold text-[10px] tracking-wider">Ou teste rápido</span>
            <span className="h-[1px] bg-gray-150 flex-1"></span>
          </div>

          {/* Quick Demo Accounts Button */}
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            id="viva-auth-quick-login"
          >
            <span>✨ Login com um clique (Criar Conta de Teste)</span>
          </button>

          {/* Mode Switcher */}
          <div className="text-center pt-3 text-xs text-gray-500">
            {isRegister ? (
              <span>
                Já possui uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-amber-500 hover:underline inline"
                >
                  Faça login
                </button>
              </span>
            ) : (
              <span>
                Não tem uma conta ainda?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-amber-500 hover:underline inlilne"
                >
                  Cadastre-se grátis
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
