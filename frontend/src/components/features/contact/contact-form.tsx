"use client";

import { FormEvent, useState } from "react";

import { ApiError, getPublicApiBase, readErrorMessage } from "@/lib/api/client";
import { buttonClassName } from "@/components/ui/button";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("이름, 이메일, 문의 내용을 모두 입력해 주세요.");
      setState("error");
      return;
    }
    const base = getPublicApiBase();
    if (!base) {
      setError("API 주소가 설정되지 않아 문의를 보낼 수 없습니다.");
      setState("error");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch(`${base}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          company,
        }),
      });
      if (!res.ok) {
        throw new ApiError(res.status, await readErrorMessage(res));
      }
      setState("success");
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (state === "success") {
    return (
      <div className="space-y-2" role="status" data-testid="e2e-contact-success">
        <p className="text-sm font-semibold text-ca-on-surface">문의가 접수되었습니다.</p>
        <p className="break-keep text-sm text-ca-on-surface-variant">
          영업일 2일 내 회신을 목표로 확인합니다. 급한 경우 아래 이메일로도 연락해 주세요.
        </p>
        <button
          type="button"
          className={buttonClassName({ variant: "outline", className: "h-11" })}
          onClick={() => setState("idle")}
        >
          다른 문의 보내기
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} data-testid="e2e-contact-form" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="contact-name" className="text-sm font-medium text-ca-on-surface">
          이름
        </label>
        <input
          id="contact-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="text-sm font-medium text-ca-on-surface">
          이메일
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          required
          maxLength={320}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="text-sm font-medium text-ca-on-surface">
          문의 내용
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          required
          maxLength={4000}
        />
      </div>
      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="contact-company">회사</label>
        <input
          id="contact-company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      {state === "error" && error ? (
        <p className="break-keep text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className={buttonClassName({ className: "h-11 w-full font-semibold sm:w-auto" })}
        disabled={state === "submitting"}
      >
        {state === "submitting" ? "보내는 중…" : "문의 보내기"}
      </button>
    </form>
  );
}
