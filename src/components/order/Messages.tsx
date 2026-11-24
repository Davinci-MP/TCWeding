type Msg = { id: string; sender: string; body: string; createdAt: Date };

export function Messages({ list, viewer }: { list: Msg[]; viewer: "CUSTOMER" | "SHOP" }) {
  if (!list.length) return <p className="text-sm text-zinc-500">Chưa có tin nhắn.</p>;
  return (
    <ul className="space-y-3">
      {list.map((m) => (
        <li key={m.id} className={`w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === viewer ? "ml-auto bg-brand text-white" : "bg-zinc-100 text-zinc-800"}`}>
          <p className="whitespace-pre-wrap break-words">{m.body}</p>
          <p className="mt-1 text-xs opacity-80">
            {m.sender === "SHOP" ? "TCWedding" : "Khách"} · {m.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" })}
          </p>
        </li>
      ))}
    </ul>
  );
}
