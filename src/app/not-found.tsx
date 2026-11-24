import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl">💔</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-2 text-zinc-500">Thiệp có thể đã bị gỡ hoặc đường dẫn không đúng.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Về trang chủ
      </Link>
    </div>
  );
}
